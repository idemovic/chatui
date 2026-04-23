import { useState, useEffect } from 'react'
import { useSettingsStore } from './store/settingsStore.ts'
import { useChatStore } from './store/chatStore.ts'
import { useTheme } from './hooks/useTheme.ts'
import { useCta } from './hooks/useCta.ts'
import { Sidebar } from './components/Sidebar.tsx'
import { ChatView } from './components/ChatView.tsx'
import { SettingsModal } from './components/SettingsModal.tsx'
import { CtaPopup } from './components/CtaPopup.tsx'
import { resolveAvatarUrl } from './assets/avatars/index.ts'

/** Tracks whether the viewport is ≥ 768 px (Tailwind's md breakpoint). */
function useIsDesktop(): boolean {
  const [isDesktop, setIsDesktop] = useState(
    () => window.matchMedia('(min-width: 768px)').matches,
  )
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)')
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])
  return isDesktop
}

export function App() {
  useTheme()

  const config = useSettingsStore((s) => s.config)
  const activeSessionId = useChatStore((s) => s.activeSessionId)
  const createSession = useChatStore((s) => s.createSession)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [windowOpen, setWindowOpen] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const language = useSettingsStore((s) => s.language)
  const { showCta, ctaText, dismiss: dismissCta } = useCta(config, language)
  const isDesktop = useIsDesktop()

  // 'mixed' = window on desktop, fullscreen on mobile
  const isWindow =
    config.mode === 'window' || (config.mode === 'mixed' && isDesktop)
  const showSidebar = !isWindow && (config.showSidebar ?? false)
  const hideSettings = config.hideSettings ?? false

  const openSettings = () => {
    if (!hideSettings) setSettingsOpen(true)
  }

  // Ensure a session exists on first load
  useEffect(() => {
    if (!activeSessionId) createSession()
  }, [activeSessionId, createSession])

  if (isWindow) {
    return (
      <>
        {/* Floating window */}
        {windowOpen && (
          <div
            className="fixed bottom-20 right-4 z-50 w-[380px] h-[560px] rounded-2xl shadow-2xl overflow-hidden flex flex-col"
            style={{ border: '1px solid var(--t-bg-border)', background: 'var(--t-bg-base)' }}
          >
            <ChatView
              showSidebar={false}
              onOpenSettings={openSettings}
            />
          </div>
        )}

        {/* CTA popup */}
        {showCta && !windowOpen && (
          <div className="fixed bottom-20 right-4 z-50">
            <CtaPopup text={ctaText} onDismiss={dismissCta} />
          </div>
        )}

        {/* Toggle button */}
        <ToggleButton
          open={windowOpen}
          iconSrc={resolveAvatarUrl(config.toggleButtonIcon)}
          onClick={() => {
            dismissCta()
            setWindowOpen((o) => !o)
          }}
        />

        {!hideSettings && settingsOpen && (
          <SettingsModal onClose={() => setSettingsOpen(false)} />
        )}
      </>
    )
  }

  // Fullscreen mode
  return (
    <div className="flex h-full" style={{ background: 'var(--t-bg-base)' }}>
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
          showSidebar={showSidebar}
          onOpenSettings={openSettings}
        />
      </div>

      {!hideSettings && settingsOpen && (
        <SettingsModal onClose={() => setSettingsOpen(false)} />
      )}
    </div>
  )
}

function ToggleButton({
  open,
  iconSrc,
  onClick,
}: {
  open: boolean
  iconSrc: string | undefined
  onClick: () => void
}) {
  const showImage = Boolean(iconSrc) && !open
  return (
    <button
      className="fixed bottom-4 right-4 z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-105 overflow-hidden"
      style={{
        background: showImage ? 'transparent' : 'var(--t-accent)',
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
