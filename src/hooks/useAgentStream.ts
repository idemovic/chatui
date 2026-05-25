import { useEffect } from 'react'
import { useChatStore } from '../store/chatStore.ts'
import { useSettingsStore } from '../store/settingsStore.ts'
import type { Message } from '../types/index.ts'

interface InitResponse {
  token: string
  streamUrl: string
  expiresAt: string
}

interface AgentReplyEvent {
  id: string
  body: string
  createdAt: string
}

/**
 * Subscribes the active session to the backend's customer SSE stream so agent replies
 * pushed by support staff appear in the conversation in real time. No-op when
 * `config.agentStream` is not configured.
 *
 * The flow is:
 *   1. POST {apiBaseUrl}/api/public/chat-stream/init  → returns a session-bound token + stream URL
 *   2. Open EventSource on that URL
 *   3. For every `agentReply` event, append a deduped 'bot' message to the active session
 *
 * The browser handles reconnect automatically, sending `Last-Event-ID` so the backend can
 * replay anything missed during the gap.
 */
export function useAgentStream(): void {
  const config = useSettingsStore((s) => s.config)
  const activeSessionId = useChatStore((s) => s.activeSessionId)
  const addMessage = useChatStore((s) => s.addMessage)
  const setAwaitingAgentReply = useChatStore((s) => s.setAwaitingAgentReply)
  const setToken = useChatStore((s) => s.setToken)

  useEffect(() => {
    const stream = config.agentStream
    if (!stream || !stream.apiBaseUrl || !stream.tenantId || !activeSessionId) return

    let cancelled = false
    let source: EventSource | null = null

    const open = async () => {
      try {
        const initRes = await fetch(`${stream.apiBaseUrl.replace(/\/$/, '')}/api/public/chat-stream/init`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tenantId: stream.tenantId, sessionId: activeSessionId }),
        })

        if (!initRes.ok) {
          // 429 (rate limited) or 4xx — silently drop; widget keeps working without live agent.
          return
        }

        const init = (await initRes.json()) as InitResponse
        if (cancelled) return

        setToken(activeSessionId, init.token, Date.parse(init.expiresAt) || (Date.now() + 3600000))

        source = new EventSource(init.streamUrl)

        source.addEventListener('agentReply', (ev: MessageEvent) => {
          let payload: AgentReplyEvent
          try {
            payload = JSON.parse(ev.data) as AgentReplyEvent
          } catch {
            return
          }

          const msg: Message = {
            id: payload.id,
            role: 'bot',
            content: payload.body,
            ts: Date.parse(payload.createdAt) || Date.now(),
          }
          addMessage(activeSessionId, msg)
          setAwaitingAgentReply(activeSessionId, false)
        })

        source.onerror = () => {
          // EventSource auto-reconnects on transient errors; nothing to do here. We deliberately
          // do not close on error: closing breaks the browser's built-in reconnect with
          // Last-Event-ID. Permanent failures (token expiry, server gone) will surface as
          // repeated 401s and the connection will eventually be torn down by the browser.
        }
      } catch {
        // Network fetch failed; fall through silently.
      }
    }

    void open()

    return () => {
      cancelled = true
      source?.close()
    }
  }, [config.agentStream, activeSessionId, addMessage, setAwaitingAgentReply])
}
