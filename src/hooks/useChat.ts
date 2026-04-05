import { useCallback } from 'react'
import { useChatStore } from '../store/chatStore.ts'
import { useSettingsStore } from '../store/settingsStore.ts'
import { sendMessage, N8nApiError } from '../lib/n8nClient.ts'
import type { Message } from '../types/index.ts'

function randomId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

export function useChat() {
  const { activeSessionId, addMessage, appendToLastBot, setStreaming, createSession } =
    useChatStore()
  const config = useSettingsStore((s) => s.config)
  const isStreaming = useChatStore((s) => s.isStreaming)

  const send = useCallback(
    async (text: string) => {
      if (!config.webhookUrl || !text.trim()) return

      const sessionId = activeSessionId ?? createSession()

      const userMsg: Message = {
        id: randomId(),
        role: 'user',
        content: text.trim(),
        ts: Date.now(),
      }
      addMessage(sessionId, userMsg)

      setStreaming(true)

      // Placeholder bot message for streaming
      const botMsg: Message = {
        id: randomId(),
        role: 'bot',
        content: '',
        ts: Date.now(),
      }
      addMessage(sessionId, botMsg)

      try {
        if (config.streaming) {
          await sendMessage(config, sessionId, text.trim(), (chunk) => {
            appendToLastBot(sessionId, chunk)
          })
        } else {
          const response = await sendMessage(config, sessionId, text.trim())
          appendToLastBot(sessionId, response)
        }
      } catch (err) {
        const errText =
          err instanceof N8nApiError
            ? `Error ${err.status ?? ''}: ${err.message}`
            : 'Something went wrong. Please try again.'
        appendToLastBot(sessionId, errText)
      } finally {
        setStreaming(false)
      }
    },
    [activeSessionId, config, addMessage, appendToLastBot, setStreaming, createSession],
  )

  return { send, isStreaming }
}
