import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useChatStore } from '../store/chatStore.ts'
import { useSettingsStore } from '../store/settingsStore.ts'
import { useChat } from '../hooks/useChat.ts'
import { MessageBubble, TypingIndicator } from './MessageBubble.tsx'
import { InputArea } from './InputArea.tsx'
import { Tabs } from './Tabs.tsx'
import { NotificationsTab } from './NotificationsTab.tsx'
import { FaqTab } from './FaqTab.tsx'
import { resolveAvatarUrl } from '../assets/avatars/index.ts'

type TabId = 'notifications' | 'help' | 'chat'

interface Props {
  onOpenSettings: () => void
}

export function ChatView({ onOpenSettings }: Props) {
  const { t } = useTranslation()
  const activeSessionId = useChatStore((s) => s.activeSessionId)
  const messages = useChatStore((s) =>
    activeSessionId ? (s.messages[activeSessionId] ?? []) : [],
  )
  const createSession = useChatStore((s) => s.createSession)
  const isStreaming = useChatStore((s) => s.isStreaming)
  const config = useSettingsStore((s) => s.config)
  const language = useSettingsStore((s) => s.language)
  const hideSettings = config.hideSettings ?? false
  const { send } = useChat()

  const bottomRef = useRef<HTMLDivElement>(null)

  // Per-language content resolution: i18n[lang] → i18n['en'] → global fallbacks
  const langData = config.i18n?.[language] ?? config.i18n?.['en'] ?? {}
  const initialMessages = langData.initialMessages ?? config.initialMessages ?? []
  const botName = langData.botName ?? config.botName ?? t('header.assistant')

  // Tabs
  const tabsCfg = config.tabs
  const notificationsCfg = tabsCfg?.notifications
  const helpCfg = tabsCfg?.help
  const tabsEnabled = !!(
    notificationsCfg?.feedUrl ||
    notificationsCfg?.items?.length ||
    helpCfg?.feedUrl ||
    helpCfg?.items?.length
  )

  const tabBar = tabsEnabled
    ? [
        notificationsCfg?.feedUrl || notificationsCfg?.items?.length
          ? {
              id: 'notifications' as const,
              label:
                langData.tabs?.notifications?.title ??
                tabsCfg?.notifications?.title ??
                t('tabs.notifications'),
              icon: 'bulb' as const,
            }
          : null,
        helpCfg?.feedUrl || helpCfg?.items?.length
          ? {
              id: 'help' as const,
              label: langData.tabs?.help?.title ?? tabsCfg?.help?.title ?? t('tabs.help'),
              icon: 'book' as const,
            }
          : null,
        {
          id: 'chat' as const,
          label: langData.tabs?.chat?.title ?? tabsCfg?.chat?.title ?? t('tabs.chat'),
          icon: 'chat' as const,
        },
      ].filter((x): x is NonNullable<typeof x> => x !== null)
    : []

  const [activeTab, setActiveTab] = useState<TabId>('chat')

  // Ensure there's always an active session
  useEffect(() => {
    if (!activeSessionId) createSession()
  }, [activeSessionId, createSession])

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isStreaming])

  const showWelcome = config.showWelcomeScreen && messages.length === 0 && !isStreaming
  const welcomeSubtitle = langData.welcomeSubtitle ?? t('welcome.subtitle')

  const showChat = !tabsEnabled || activeTab === 'chat'

  return (
    <div className="flex flex-col h-full min-w-0">
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b flex-shrink-0"
        style={{ borderColor: 'var(--t-bg-border)', background: 'var(--t-bg-base)' }}
      >
        <div className="flex items-center gap-2">
          {resolveAvatarUrl(config.botAvatar) ? (
            <img
              src={resolveAvatarUrl(config.botAvatar)}
              alt=""
              className="w-7 h-7 rounded-full object-cover flex-shrink-0"
              style={{ border: '1px solid var(--t-bg-border)' }}
            />
          ) : (
            <div className="w-2 h-2 rounded-full" style={{ background: 'var(--t-accent)' }} />
          )}
          <span className="text-sm font-semibold text-fg-primary">{botName}</span>
          {config.webhookUrl ? (
            <span className="text-xs text-fg-muted">● {t('header.online')}</span>
          ) : (
            <span className="text-xs text-fg-muted">{t('header.notConfigured')}</span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {!hideSettings && (
            <button
              onClick={onOpenSettings}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-fg-secondary hover:text-fg-primary hover:bg-bg-surface transition-colors"
              title={t('sidebar.settings')}
            >
              <SettingsIcon />
            </button>
          )}
        </div>
      </div>

      {/* Tab bar (only when tabs are configured) */}
      {tabsEnabled && (
        <Tabs tabs={tabBar} activeId={activeTab} onChange={(id) => setActiveTab(id as TabId)} />
      )}

      {/* Tab body */}
      {tabsEnabled && activeTab === 'notifications' && (
        <NotificationsTab
          feedUrl={notificationsCfg?.feedUrl}
          inlineItems={notificationsCfg?.items}
        />
      )}
      {tabsEnabled && activeTab === 'help' && (
        <FaqTab feedUrl={helpCfg?.feedUrl} inlineItems={helpCfg?.items} />
      )}

      {/* Chat (default tab, or shown when no tabs configured) */}
      {showChat && (
        <>
          <div className="flex-1 overflow-y-auto px-4 py-4">
            {showWelcome ? (
              <WelcomeScreen botName={botName} subtitle={welcomeSubtitle} />
            ) : (
              <>
                {messages.length === 0 &&
                  initialMessages.map((msg, i) => (
                    <MessageBubble
                      key={i}
                      message={{ id: String(i), role: 'bot', content: msg, ts: Date.now() }}
                    />
                  ))}
                {messages.map((msg, i) => {
                  const isEmptyBotPlaceholder =
                    isStreaming &&
                    i === messages.length - 1 &&
                    msg.role === 'bot' &&
                    msg.content === ''
                  if (isEmptyBotPlaceholder) return null
                  return <MessageBubble key={msg.id} message={msg} />
                })}
                {isStreaming &&
                  messages[messages.length - 1]?.role === 'bot' &&
                  messages[messages.length - 1]?.content === '' && <TypingIndicator />}
              </>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <InputArea
            onSend={send}
            disabled={isStreaming || !config.webhookUrl}
            placeholder={
              !config.webhookUrl ? t('input.placeholderUnconfigured') : t('input.placeholder')
            }
            allowFileUploads={config.allowFileUploads}
          />
        </>
      )}
    </div>
  )
}

function WelcomeScreen({ botName, subtitle }: { botName: string; subtitle: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-8">
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl"
        style={{ background: 'var(--t-accent)', color: 'var(--t-accent-fg)' }}
      >
        💬
      </div>
      <div>
        <h2 className="text-lg font-semibold text-fg-primary mb-1">{botName}</h2>
        <p className="text-sm text-fg-secondary">{subtitle}</p>
      </div>
    </div>
  )
}

function SettingsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  )
}
