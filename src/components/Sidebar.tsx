import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useChatStore } from '../store/chatStore.ts'
import { ThemePicker } from './ThemePicker.tsx'

interface Props {
  publicMode?: boolean
  onOpenSettings: () => void
}

export function Sidebar({ publicMode, onOpenSettings }: Props) {
  const { t } = useTranslation()
  const sessions = useChatStore((s) => s.sessions)
  const activeSessionId = useChatStore((s) => s.activeSessionId)
  const createSession = useChatStore((s) => s.createSession)
  const setActiveSession = useChatStore((s) => s.setActiveSession)
  const deleteSession = useChatStore((s) => s.deleteSession)
  const [hovered, setHovered] = useState<string | null>(null)

  return (
    <aside
      className="flex flex-col h-full w-64 flex-shrink-0 border-r"
      style={{ background: 'var(--t-bg-surface)', borderColor: 'var(--t-bg-border)' }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b"
        style={{ borderColor: 'var(--t-bg-border)' }}
      >
        <span className="text-sm font-semibold text-fg-primary">{t('sidebar.title')}</span>
        <button
          onClick={() => createSession()}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-fg-secondary hover:text-fg-primary hover:bg-bg-surface2 transition-colors"
          title={t('sidebar.newChat')}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
      </div>

      {/* Session list */}
      <div className="flex-1 overflow-y-auto py-2">
        {sessions.length === 0 && (
          <p className="text-xs text-fg-muted px-4 py-3">{t('sidebar.empty')}</p>
        )}
        {sessions.map((sess) => (
          <div
            key={sess.id}
            onMouseEnter={() => setHovered(sess.id)}
            onMouseLeave={() => setHovered(null)}
            className="group flex items-center gap-2 px-3 py-2 mx-2 rounded-lg cursor-pointer transition-colors"
            style={
              activeSessionId === sess.id
                ? { background: 'var(--t-bg-surface2)' }
                : hovered === sess.id
                  ? { background: 'var(--t-bg-surface2)', opacity: 0.7 }
                  : {}
            }
            onClick={() => setActiveSession(sess.id)}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="flex-shrink-0 text-fg-muted"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <span className="flex-1 text-xs text-fg-secondary truncate">{sess.title}</span>
            {(activeSessionId === sess.id || hovered === sess.id) && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  deleteSession(sess.id)
                }}
                className="flex-shrink-0 w-5 h-5 rounded flex items-center justify-center text-fg-muted hover:text-fg-primary transition-colors"
                title="Delete"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Bottom: theme picker + settings */}
      <div
        className="border-t"
        style={{ borderColor: 'var(--t-bg-border)' }}
      >
        {!publicMode && <ThemePicker />}
        {!publicMode && (
          <div className="px-3 pb-3">
            <button
              onClick={onOpenSettings}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-fg-secondary hover:text-fg-primary hover:bg-bg-surface2 transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
              {t('sidebar.settings')}
            </button>
          </div>
        )}
      </div>
    </aside>
  )
}
