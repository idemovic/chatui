import './i18n.ts'
import './index.css'
import { useState, useEffect, useRef } from 'react'
import { useSettingsStore } from './store/settingsStore.ts'
import { useChatStore } from './store/chatStore.ts'
import { useTheme } from './hooks/useTheme.ts'
import { useCta } from './hooks/useCta.ts'
import { useAgentStream } from './hooks/useAgentStream.ts'
import { Sidebar } from './components/Sidebar.tsx'
import { ChatView } from './components/ChatView.tsx'
import { SettingsModal } from './components/SettingsModal.tsx'
import { CtaPopup } from './components/CtaPopup.tsx'
import { resolveAvatarUrl } from './assets/avatars/index.ts'

/** Tracks whether the viewport qualifies as desktop.
 *  Requires both min-width: 768px and min-height: 600px so phones in
 *  landscape (wide but short) fall back to fullscreen instead of the
 *  fixed-height floating window. */
function useIsDesktop(): boolean {
  const MQ = '(min-width: 768px) and (min-height: 600px)'
  const [isDesktop, setIsDesktop] = useState(() => window.matchMedia(MQ).matches)
  useEffect(() => {
    const mq = window.matchMedia(MQ)
    const handler = () => setIsDesktop(mq.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])
  return isDesktop
}

export function App() {
  const wrapperRef = useRef<HTMLDivElement>(null)
  useTheme({ elementRef: wrapperRef })
  useAgentStream()

  const config = useSettingsStore((s) => s.config)
  const activeSessionId = useChatStore((s) => s.activeSessionId)
  const createSession = useChatStore((s) => s.createSession)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const language = useSettingsStore((s) => s.language)
  const isDesktop = useIsDesktop()

  // 'mixed' = window on desktop, fullscreen on mobile
  const isWindow =
    config.mode === 'window' || (config.mode === 'mixed' && isDesktop)

  const [chatOpen, setChatOpen] = useState(false)

  const showSidebar = false; // not using sidebar currently
  const hideSettings = config.hideSettings ?? false

  const { showCta, ctaText, dismiss: dismissCta } = useCta(config, language, true)

  const openSettings = () => {
    if (!hideSettings) setSettingsOpen(true)
  }

  // Ensure a session exists on first load
  useEffect(() => {
    if (!activeSessionId) createSession()
  }, [activeSessionId, createSession])

  const closeChat = () => setChatOpen(false)
  const openChat = () => {
    dismissCta()
    setChatOpen(true)
  }

  // Fullscreen-style content (used by all non-window layouts)
  const fullscreenContent = (
    <div className="flex h-full w-full" style={{ background: 'var(--t-bg-base)' }}>
      {/* Mobile sidebar backdrop */}
      {mobileSidebarOpen && showSidebar && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      {showSidebar && (
        <div
          className={`
            fixed md:relative inset-y-0 left-0 z-40
            transition-transform md:translate-x-0
            ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          `}
        >
          <Sidebar onOpenSettings={openSettings} />
        </div>
      )}

      {/* Main chat */}
      <div className="flex-1 flex flex-col min-w-0 h-full">
        {/* Mobile hamburger */}
        {showSidebar && (
          <button
            className="md:hidden absolute top-3 left-3 z-20 w-8 h-8 flex items-center justify-center text-fg-secondary"
            onClick={() => setMobileSidebarOpen((o) => !o)}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 12h18M3 6h18M3 18h18" />
            </svg>
          </button>
        )}
        <ChatView
          onOpenSettings={openSettings}
          onClose={closeChat}
        />
      </div>
    </div>
  )

  // ── Window mode (or 'mixed' on desktop) ─────────────────────────────────
  if (isWindow) {
    return (
      <div className="chat-ui" ref={wrapperRef}>
        {chatOpen && (
          <div
            className="fixed bottom-4 right-4 z-50 w-[380px] rounded-2xl shadow-2xl overflow-hidden flex flex-col"
            style={{ border: '1px solid var(--t-bg-border)', background: 'var(--t-bg-base)', height: 'min(560px, calc(100vh - 32px))' }}
          >
            <ChatView onOpenSettings={openSettings} onClose={closeChat} />
          </div>
        )}

        {showCta && !chatOpen && (
          <div className="fixed bottom-20 right-4 z-50">
            <CtaPopup text={ctaText} onDismiss={dismissCta} />
          </div>
        )}

        {!chatOpen && (
          <ToggleButton
            open={false}
            iconSrc={resolveAvatarUrl(config.toggleButtonIcon)}
            iconKey={config.toggleButtonIcon}
            onClick={openChat}
          />
        )}

        {!hideSettings && settingsOpen && (
          <SettingsModal onClose={() => setSettingsOpen(false)} />
        )}
      </div>
    )
  }

  // ── Bottom-sheet OR mixed-on-mobile — dismissable, with toggle button ───
  const sheetHeight = config.fullscreenSheetHeight ?? '75vh'
  const useSheet = config.fullscreenSheet === true

  return (
    <div className="chat-ui" ref={wrapperRef}>
      {chatOpen ? (
        useSheet ? (
          <>
            {/* Dimmed backdrop above the sheet */}
            <div
              className="fixed inset-0 z-40 pointer-events-none"
              style={{ background: 'rgba(0, 0, 0, 0.4)' }}
            />
            <div
              className="fixed inset-x-0 bottom-0 z-50 flex flex-col overflow-hidden"
              style={{
                height: sheetHeight,
                borderTopLeftRadius: '20px',
                borderTopRightRadius: '20px',
                background: 'var(--t-bg-base)',
                boxShadow: '0 -8px 32px rgba(0, 0, 0, 0.18)',
              }}
            >
              <div className="flex justify-center pt-2 pb-1 flex-shrink-0">
                <div
                  className="w-10 h-1 rounded-full"
                  style={{ background: 'var(--t-bg-border)' }}
                />
              </div>
              <div className="flex-1 min-h-0">{fullscreenContent}</div>
            </div>
          </>
        ) : (
          // Mixed mode on mobile: full-screen overlay with close button in header
          <div className="fixed inset-0 z-50">{fullscreenContent}</div>
        )
      ) : (
        <>
          {showCta && (
            <div className="fixed bottom-20 right-4 z-50">
              <CtaPopup text={ctaText} onDismiss={dismissCta} />
            </div>
          )}
          <ToggleButton
            open={false}
            iconSrc={resolveAvatarUrl(config.toggleButtonIcon)}
            iconKey={config.toggleButtonIcon}
            onClick={openChat}
          />
        </>
      )}

      {!hideSettings && settingsOpen && (
        <SettingsModal onClose={() => setSettingsOpen(false)} />
      )}
    </div>
  )
}

function ToggleButton({
  open,
  iconSrc,
  iconKey,
  onClick,
}: {
  open: boolean
  iconSrc: string | undefined
  iconKey?: string
  onClick: () => void
}) {
  const showImage = Boolean(iconSrc) && !open
  const isBubble = !iconKey || iconKey === 'bubble'
  return (
    <button
      className="fixed bottom-4 right-4 z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-105 overflow-hidden"
      style={{
        background: isBubble ? 'var(--t-accent)' : 'var(--t-chatbutton-bg)',
        color: 'var(--t-accent-fg)',
      }}
      onClick={onClick}
      aria-label="Toggle chat"
    >
      {open ? (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      ) : showImage ? (
        <img src={iconSrc} alt="" className="w-full h-full object-cover" />
      ) : (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      )}
    </button>
  )
}
