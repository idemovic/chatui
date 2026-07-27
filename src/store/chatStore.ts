import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Message, Session } from '../types/index.ts'
import { scopedKey } from '../lib/storage.ts'

function randomId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

export interface ChatState {
  sessions: Session[]
  activeSessionId: string | null
  messages: Record<string, Message[]>
  isStreaming: boolean
  // Set when the n8n workflow short-circuits (active live-agent interaction) so the UI can
  // keep showing the typing indicator until the agent's reply arrives over SSE. Keyed by
  // session so concurrent sessions don't share state. Not persisted.
  awaitingAgentReply: Record<string, boolean>
  tokens: Record<string, { token: string; expiresAt: number }>

  createSession(): string
  setActiveSession(id: string): void
  addMessage(sessionId: string, msg: Message): void
  appendToLastBot(sessionId: string, chunk: string): void
  removeLastBotIfEmpty(sessionId: string): void
  setStreaming(val: boolean): void
  setAwaitingAgentReply(sessionId: string, val: boolean): void
  setToken(sessionId: string, token: string, expiresAt: number): void
  updateMessageStatus(
    sessionId: string,
    messageId: string,
    status: NonNullable<Message['status']>,
  ): void
  deleteSession(id: string): void
  renameSession(id: string, title: string): void
  clearMessages(sessionId: string): void
}

/**
 * Creates one createChat() instance's session/message store. Each instance gets its own store
 * (see StoreContext.tsx) so simultaneous instances on the same page don't share conversations.
 * `namespace` scopes the localStorage key for the same reason - omit it to keep the default
 * key (matches pre-multi-instance behaviour for the common single-widget-per-page case).
 */
export function createChatStore(namespace?: string) {
  return create<ChatState>()(
    persist(
      (set, get) => ({
        sessions: [],
        activeSessionId: null,
        messages: {},
        isStreaming: false,
        awaitingAgentReply: {},
        tokens: {},

        createSession() {
          const id = randomId()
          const session: Session = {
            id,
            title: 'New conversation',
            createdAt: Date.now(),
          }
          set((s) => ({
            sessions: [session, ...s.sessions],
            activeSessionId: id,
            messages: { ...s.messages, [id]: [] },
          }))
          return id
        },

        setToken(sessionId, token, expiresAt) {
          set((s) => ({
            tokens: { ...s.tokens, [sessionId]: { token, expiresAt } },
          }))
        },

        setActiveSession(id) {
          set({ activeSessionId: id })
        },

        addMessage(sessionId, msg) {
          set((s) => {
            const existing = s.messages[sessionId] ?? []

            // Idempotent insert: drop the call when a message with this id is already in the
            // session. Protects against double-delivery from the agent SSE replay path running
            // alongside live events.
            if (existing.some((m) => m.id === msg.id)) return {}

            const updated = [...existing, msg]

            // Auto-title from first user message
            const sessions = s.sessions.map((sess) => {
              if (sess.id !== sessionId) return sess
              if (sess.title !== 'New conversation') return sess
              if (msg.role !== 'user') return sess
              return { ...sess, title: msg.content.slice(0, 50) }
            })

            return {
              sessions,
              messages: { ...s.messages, [sessionId]: updated },
            }
          })
        },

        appendToLastBot(sessionId, chunk) {
          set((s) => {
            const existing = s.messages[sessionId] ?? []
            if (existing.length === 0) return {}
            const last = existing[existing.length - 1]!
            if (last.role !== 'bot') return {}
            const updated = [
              ...existing.slice(0, -1),
              { ...last, content: last.content + chunk },
            ]
            return { messages: { ...s.messages, [sessionId]: updated } }
          })
        },

        removeLastBotIfEmpty(sessionId) {
          set((s) => {
            const existing = s.messages[sessionId] ?? []
            if (existing.length === 0) return {}
            const last = existing[existing.length - 1]!
            if (last.role !== 'bot' || last.content !== '') return {}
            return {
              messages: { ...s.messages, [sessionId]: existing.slice(0, -1) },
            }
          })
        },

        setStreaming(val) {
          set({ isStreaming: val })
        },

        setAwaitingAgentReply(sessionId, val) {
          set((s) => {
            const next = { ...s.awaitingAgentReply }
            if (val) next[sessionId] = true
            else delete next[sessionId]
            return { awaitingAgentReply: next }
          })
        },

        updateMessageStatus(sessionId, messageId, status) {
          set((s) => {
            const existing = s.messages[sessionId]
            if (!existing) return {}
            let touched = false
            const updated = existing.map((m) => {
              if (m.id !== messageId || m.status === status) return m
              touched = true
              return { ...m, status }
            })
            if (!touched) return {}
            return { messages: { ...s.messages, [sessionId]: updated } }
          })
        },

        deleteSession(id) {
          set((s) => {
            const sessions = s.sessions.filter((sess) => sess.id !== id)
            const messages = { ...s.messages }
            delete messages[id]
            const awaitingAgentReply = { ...s.awaitingAgentReply }
            delete awaitingAgentReply[id]
            const activeSessionId =
              s.activeSessionId === id ? (sessions[0]?.id ?? null) : s.activeSessionId
            return { sessions, messages, awaitingAgentReply, activeSessionId }
          })
        },

        renameSession(id, title) {
          set((s) => ({
            sessions: s.sessions.map((sess) =>
              sess.id === id ? { ...sess, title } : sess,
            ),
          }))
        },

        clearMessages(sessionId) {
          set((s) => {
            const awaitingAgentReply = { ...s.awaitingAgentReply }
            delete awaitingAgentReply[sessionId]
            return {
              messages: { ...s.messages, [sessionId]: [] },
              awaitingAgentReply,
            }
          })
          // Also reset title
          get().renameSession(sessionId, 'New conversation')
        },
      }),
      {
        name: scopedKey('chatui-chat', namespace),
        partialize: (s) => ({
          sessions: s.sessions,
          activeSessionId: s.activeSessionId,
          messages: s.messages,
        }),
      },
    ),
  )
}
