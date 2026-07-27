import { useCallback } from 'react'
import { useSettingsStore, useChatStore, useChatStoreApi } from '../store/StoreContext.tsx'
import { sendMessage } from '../lib/n8nClient.ts'
import type { Message, Attachment } from '../types/index.ts'

function randomId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

export function useChat() {
  const {
    activeSessionId,
    addMessage,
    appendToLastBot,
    removeLastBotIfEmpty,
    setStreaming,
    setAwaitingAgentReply,
    updateMessageStatus,
    createSession,
  } = useChatStore()
  const chatStoreApi = useChatStoreApi()
  const config = useSettingsStore((s) => s.config)
  const language = useSettingsStore((s) => s.language)
  const isStreaming = useChatStore((s) => s.isStreaming)

  const dispatch = useCallback(
    async (text: string, userMessageId: string, sessionId: string, attachments?: Attachment[]) => {
      // Mark the user message as in-flight whether this is the first try or a retry.
      updateMessageStatus(sessionId, userMessageId, 'sending')
      setStreaming(true)

      // Placeholder bot bubble that streaming chunks append into. Removed on failure or when
      // n8n short-circuits (empty body = live-agent handoff signal).
      const botMsg: Message = {
        id: randomId(),
        role: 'bot',
        content: '',
        ts: Date.now(),
      }
      addMessage(sessionId, botMsg)

      try {
        if (config.streaming) {
          await sendMessage(config, sessionId, text, language, attachments, (chunk) => {
            appendToLastBot(sessionId, chunk)
          })
        } else {
          const response = await sendMessage(config, sessionId, text, language, attachments)
          if (response) appendToLastBot(sessionId, response)
        }

        // Empty response = n8n short-circuited because a live agent is handling this
        // sender. Drop the empty bot placeholder and keep the typing indicator visible
        // until the agent's reply arrives over the SSE stream.
        const lastMsg = chatStoreApi.getState().messages[sessionId]?.slice(-1)[0]
        if (lastMsg?.role === 'bot' && lastMsg.content === '') {
          removeLastBotIfEmpty(sessionId)
          setAwaitingAgentReply(sessionId, true)
        }

        updateMessageStatus(sessionId, userMessageId, 'sent')
      } catch {
        // Drop the empty bot placeholder — the failure belongs on the *user* bubble (Retry
        // chip) rather than masquerading as a bot reply. If chunks already streamed in,
        // leave them; the partial reply is still useful context for the retry.
        removeLastBotIfEmpty(sessionId)
        updateMessageStatus(sessionId, userMessageId, 'failed')
      } finally {
        setStreaming(false)
      }
    },
    [
      config,
      language,
      addMessage,
      appendToLastBot,
      removeLastBotIfEmpty,
      setStreaming,
      setAwaitingAgentReply,
      updateMessageStatus,
      chatStoreApi,
    ],
  )

  const send = useCallback(
    async (text: string, attachments?: Attachment[]) => {
      const hasAttachments = attachments && attachments.length > 0
      if (!config.webhookUrl) return
      if (!text.trim() && !hasAttachments) return

      const sessionId = activeSessionId ?? createSession()
      const trimmed = text.trim()

      const userMsg: Message = {
        id: randomId(),
        role: 'user',
        content: trimmed,
        ts: Date.now(),
        status: 'sending',
        attachments,
      }
      addMessage(sessionId, userMsg)

      await dispatch(trimmed, userMsg.id, sessionId, attachments)
    },
    [config.webhookUrl, activeSessionId, createSession, addMessage, dispatch],
  )

  const retry = useCallback(
    async (messageId: string) => {
      const state = chatStoreApi.getState()
      const sessionId = state.activeSessionId
      if (!sessionId) return

      const message = state.messages[sessionId]?.find((m) => m.id === messageId)
      if (!message || message.role !== 'user' || message.status !== 'failed') return
      if (!config.webhookUrl) return

      await dispatch(message.content, messageId, sessionId, message.attachments)
    },
    [config.webhookUrl, dispatch, chatStoreApi],
  )

  return { send, retry, isStreaming }
}
