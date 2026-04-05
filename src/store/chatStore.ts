import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Message, Session } from '../types/index.ts'

function randomId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

interface ChatState {
  sessions: Session[]
  activeSessionId: string | null
  messages: Record<string, Message[]>
  isStreaming: boolean

  createSession(): string
  setActiveSession(id: string): void
  addMessage(sessionId: string, msg: Message): void
  appendToLastBot(sessionId: string, chunk: string): void
  setStreaming(val: boolean): void
  deleteSession(id: string): void
  renameSession(id: string, title: string): void
  clearMessages(sessionId: string): void
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      sessions: [],
      activeSessionId: null,
      messages: {},
      isStreaming: false,

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

      setActiveSession(id) {
        set({ activeSessionId: id })
      },

      addMessage(sessionId, msg) {
        set((s) => {
          const existing = s.messages[sessionId] ?? []
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

      setStreaming(val) {
        set({ isStreaming: val })
      },

      deleteSession(id) {
        set((s) => {
          const sessions = s.sessions.filter((sess) => sess.id !== id)
          const messages = { ...s.messages }
          delete messages[id]
          const activeSessionId =
            s.activeSessionId === id ? (sessions[0]?.id ?? null) : s.activeSessionId
          return { sessions, messages, activeSessionId }
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
        set((s) => ({
          messages: { ...s.messages, [sessionId]: [] },
        }))
        // Also reset title
        get().renameSession(sessionId, 'New conversation')
      },
    }),
    {
      name: 'chatui-chat',
      partialize: (s) => ({
        sessions: s.sessions,
        activeSessionId: s.activeSessionId,
        messages: s.messages,
      }),
    },
  ),
)
