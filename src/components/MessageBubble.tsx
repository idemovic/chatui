import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useTranslation } from 'react-i18next'
import { useSettingsStore } from '../store/settingsStore.ts'
import { effectiveAvatarKey, resolveAvatarUrl } from '../assets/avatars/index.ts'
import type { Message } from '../types/index.ts'

interface Props {
  message: Message
  /** Invoked when the user clicks "Retry" on a failed user message. */
  onRetry?: (messageId: string) => void
}

function BotAvatar() {
  const botAvatar = useSettingsStore((s) => s.config.botAvatar)
  const url = resolveAvatarUrl(botAvatar)
  if (url) {
    const isBubble = effectiveAvatarKey(botAvatar) === 'bubble'
    return (
      <div
        className="w-7 h-7 rounded-full flex-shrink-0 overflow-hidden"
        style={{ background: isBubble ? 'var(--t-accent)' : 'var(--t-avatar-bg)' }}
      >
        <img src={url} alt="" className="w-full h-full object-cover" />
      </div>
    )
  }
  return (
    <div
      className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold"
      style={{ background: 'var(--t-bg-base)', color: 'var(--t-fg-secondary)' }}
    >
      A
    </div>
  )
}

function formatTime(ts: number, lang?: string): string {
  return new Intl.DateTimeFormat(lang, {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(ts))
}

export function MessageBubble({ message, onRetry }: Props) {
  const { t, i18n } = useTranslation()
  const isUser = message.role === 'user'
  const isFailed = isUser && message.status === 'failed'
  const isSending = isUser && message.status === 'sending'

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'} items-end mb-4`}>
      {/* Avatar */}
      {isUser ? (
        <div
          className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center"
          style={{ background: 'var(--t-user-bubble)', color: 'var(--t-user-fg)' }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </div>
      ) : (
        <BotAvatar />
      )}

      <div className={`flex flex-col gap-1 max-w-[88%] ${isUser ? 'items-end' : 'items-start'}`}>
        {/* Bubble */}
        <div
          className="px-4 py-2.5 rounded-2xl text-sm leading-relaxed break-words"
          style={
            isUser
              ? {
                background: 'var(--t-user-bubble)',
                color: 'var(--t-user-fg)',
                borderBottomRightRadius: '4px',
                opacity: isSending ? 0.7 : 1,
                outline: isFailed ? '1px solid rgba(239, 68, 68, 0.6)' : undefined,
              }
              : {
                background: 'var(--t-bg-surface)',
                color: 'var(--t-fg-primary)',
                border: '1px solid var(--t-bg-border)',
                borderBottomLeftRadius: '4px',
              }
          }
        >
          {isUser ? (
            <span>{message.content}</span>
          ) : (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                pre: ({ children }) => (
                  <pre className="bg-bg-base rounded p-3 overflow-x-auto text-xs my-2">
                    {children}
                  </pre>
                ),
                code: ({ children }) => (
                  <code className="bg-bg-base px-1.5 py-0.5 rounded text-xs">{children}</code>
                ),
                ul: ({ children }) => <ul className="list-disc pl-5 mb-2">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal pl-5 mb-2">{children}</ol>,
                a: ({ href, children }) => (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent underline"
                  >
                    {children}
                  </a>
                ),
              }}
            >
              {message.content}
            </ReactMarkdown>
          )}

          {message.attachments && message.attachments.length > 0 && (
            <div className="flex flex-col gap-2 mt-2 min-w-[200px]">
              {message.attachments.map((file, idx) => (
                <a
                  key={idx}
                  href={file.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-2.5 rounded-xl border transition-all text-xs font-medium no-underline hover:opacity-90"
                  style={
                    isUser
                      ? {
                          background: 'rgba(255, 255, 255, 0.15)',
                          color: 'var(--t-user-fg)',
                          borderColor: 'rgba(255, 255, 255, 0.25)',
                        }
                      : {
                          background: 'var(--t-bg-surface2, var(--t-bg-surface))',
                          color: 'var(--t-fg-primary)',
                          borderColor: 'var(--t-bg-border)',
                        }
                  }
                  title={`Download ${file.name}`}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0">
                    <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
                    <path d="M14 2v4a2 2 0 0 0 2 2h4" />
                  </svg>
                  <div className="flex-1 min-w-0">
                    <div className="truncate font-semibold">{file.name}</div>
                    {file.size && (
                      <div className="opacity-75 text-[10px]">
                        {(file.size / 1024).toFixed(0)} KB
                      </div>
                    )}
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="flex-shrink-0">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" x2="12" y1="15" y2="3" />
                  </svg>
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Status row: timestamp + (on failure) retry chip */}
        <div className="flex items-center gap-2 px-1">
          {isFailed ? (
            <>
              <span className="text-xs" style={{ color: 'rgb(239, 68, 68)' }}>
                {t('errors.failedToSend')}
              </span>
              {onRetry && (
                <button
                  type="button"
                  onClick={() => onRetry(message.id)}
                  className="text-xs underline"
                  style={{ color: 'rgb(239, 68, 68)', textUnderlineOffset: '2px' }}
                >
                  {t('errors.retry')}
                </button>
              )}
            </>
          ) : (
            <span className="text-xs text-fg-muted">{formatTime(message.ts, i18n.language)}</span>
          )}
        </div>
      </div>
    </div>
  )
}

export function TypingIndicator() {
  return (
    <div className="flex gap-3 items-end mb-4">
      <BotAvatar />
      <div
        className="px-4 py-3 rounded-2xl flex gap-1.5 items-center"
        style={{
          background: 'var(--t-bg-surface)',
          border: '1px solid var(--t-bg-border)',
          borderBottomLeftRadius: '4px',
        }}
      >
        <span className="typing-dot" />
        <span className="typing-dot" />
        <span className="typing-dot" />
      </div>
    </div>
  )
}
