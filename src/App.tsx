import './index.css'
import { useState, useEffect, useRef } from 'react'
import { useSettingsStore, useChatStore, useStorageNamespace } from './store/StoreContext.tsx'
import { scopedKey } from './lib/storage.ts'
import { useTheme } from './hooks/useTheme.ts'
import { useCta } from './hooks/useCta.ts'
import { useAgentStream } from './hooks/useAgentStream.ts'
import { Sidebar } from './components/Sidebar.tsx'
import { ChatView } from './components/ChatView.tsx'
import { SettingsModal } from './components/SettingsModal.tsx'
import { CtaPopup } from './components/CtaPopup.tsx'
import { effectiveAvatarKey, resolveAvatarUrl, avatarContainerBg } from './assets/avatars/index.ts'

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

  const isLeft = config.position === 'left'
  const side = isLeft ? 'left-4' : 'right-4'

  const [chatOpen, setChatOpen] = useState(false)
  const maximizedKey = scopedKey('chatui-maximized', useStorageNamespace())
  const [maximized, setMaximized] = useState(() => sessionStorage.getItem(maximizedKey) === '1')

  const showSidebar = false; // not using sidebar currently
  const hideSettings = config.hideSettings ?? false

  const { showCta, ctaText, dismiss: dismissCta } = useCta(config, language, true)

  const openSettings = () => {
    if (!hideSettings) setSettingsOpen(true)
  }

  useEffect(() => {
    sessionStorage.setItem(maximizedKey, maximized ? '1' : '0')
    if (wrapperRef.current) {
      wrapperRef.current.style.zIndex = maximized ? '1000000' : ''
    }
  }, [maximized, maximizedKey])

  useEffect(() => {
    if (maximized && chatOpen) {
      const prev = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = prev }
    }
  }, [maximized, chatOpen])

  useEffect(() => {
    if (wrapperRef.current) {
      wrapperRef.current.dataset.position = config.position ?? 'right'
    }
  }, [config.position, wrapperRef])

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

  // ── Embedded mode — fills the target element, no toggle button ──────────
  if (config.mode === 'embedded') {
    return (
      // .chat-ui's base CSS sets position: absolute (needed so window/mixed/fullscreen
      // modes can stack fixed-positioned children above the page), which takes this div
      // out of flow and breaks its flex/w-full sizing. Embedded mode has no fixed-positioned
      // children, so override back to a normal flow position here.
      <div className="chat-ui flex flex-col h-full w-full" ref={wrapperRef} style={{ position: 'static' }}>
        <ChatView onOpenSettings={openSettings} />
        {!hideSettings && settingsOpen && (
          <SettingsModal onClose={() => setSettingsOpen(false)} />
        )}
      </div>
    )
  }

  // ── Window mode (or 'mixed' on desktop) ─────────────────────────────────
  if (isWindow) {
    return (
      <div className="chat-ui" ref={wrapperRef}>
        {chatOpen && maximized && (
          <div className="fixed inset-0 z-40" style={{ background: 'rgba(0,0,0,0.85)', pointerEvents: 'all', cursor: 'default' }} />
        )}

        {chatOpen && (
          <div
            className={`fixed z-50 rounded-2xl shadow-2xl overflow-hidden flex flex-col ${
              maximized ? '' : `bottom-4 ${side} w-[380px]`
            }`}
            style={{
              border: '1px solid var(--t-bg-border)',
              background: 'var(--t-bg-base)',
              ...(maximized
                ? { top: '1rem', bottom: '1rem', left: 0, right: 0, margin: '0 auto', width: 'calc(100% - 2rem)', maxWidth: '800px' }
                : { height: 'min(560px, calc(100vh - 32px))' }
              ),
            }}
          >
            <ChatView
              onOpenSettings={openSettings}
              onClose={closeChat}
              maximized={maximized}
              onToggleMaximize={() => setMaximized((m) => !m)}
            />
          </div>
        )}

        {showCta && !chatOpen && (
          <div className={`fixed bottom-20 ${side} z-50`}>
            <CtaPopup text={ctaText} onDismiss={dismissCta} align={isLeft ? 'left' : 'right'} />
          </div>
        )}

        {!chatOpen && (
          <ToggleButton
            open={false}
            iconSrc={resolveAvatarUrl(config.toggleButtonIcon ?? config.botAvatar)}
            iconKey={config.toggleButtonIcon ?? config.botAvatar}
            align={isLeft ? 'left' : 'right'}
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
            <div className={`fixed bottom-20 ${side} z-50`}>
              <CtaPopup text={ctaText} onDismiss={dismissCta} align={isLeft ? 'left' : 'right'} />
            </div>
          )}
          <ToggleButton
            open={false}
            iconSrc={resolveAvatarUrl(config.toggleButtonIcon ?? config.botAvatar)}
            iconKey={config.toggleButtonIcon ?? config.botAvatar}
            align={isLeft ? 'left' : 'right'}
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
  align = 'right',
  onClick,
}: {
  open: boolean
  iconSrc: string | undefined
  iconKey?: string
  align?: 'right' | 'left'
  onClick: () => void
}) {
  const showImage = Boolean(iconSrc) && !open
  const resolvedKey = effectiveAvatarKey(iconKey)
  const isBubble = !resolvedKey || resolvedKey === 'bubble'
  return (
    <button
      className={`fixed bottom-4 ${align === 'left' ? 'left-4' : 'right-4'} z-50 w-14 h-14 rounded-full flex items-center justify-center transition-transform hover:scale-105 overflow-hidden`}
      style={{
        background: isBubble ? 'var(--t-accent)' : avatarContainerBg(iconKey),
        color: 'var(--t-accent-fg)',
        boxShadow: '0 10px 28px -4px rgba(0, 0, 0, 0.35), 0 4px 12px -2px rgba(0, 0, 0, 0.18)',
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
