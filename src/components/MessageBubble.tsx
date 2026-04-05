import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { Message } from '../types/index.ts'

interface Props {
  message: Message
}

function formatTime(ts: number): string {
  return new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(ts))
}

export function MessageBubble({ message }: Props) {
  const isUser = message.role === 'user'

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'} items-end mb-4`}>
      {/* Avatar */}
      <div
        className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold"
        style={
          isUser
            ? { background: 'var(--t-user-bubble)', color: 'var(--t-user-fg)' }
            : { background: 'var(--t-bg-surface2)', color: 'var(--t-fg-secondary)' }
        }
      >
        {isUser ? 'U' : 'A'}
      </div>

      <div className={`flex flex-col gap-1 max-w-[75%] ${isUser ? 'items-end' : 'items-start'}`}>
        {/* Bubble */}
        <div
          className="px-4 py-2.5 rounded-2xl text-sm leading-relaxed break-words"
          style={
            isUser
              ? {
                  background: 'var(--t-user-bubble)',
                  color: 'var(--t-user-fg)',
                  borderBottomRightRadius: '4px',
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
        </div>

        {/* Timestamp */}
        <span className="text-xs text-fg-muted px-1">{formatTime(message.ts)}</span>
      </div>
    </div>
  )
}

export function TypingIndicator() {
  return (
    <div className="flex gap-3 items-end mb-4">
      <div
        className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold"
        style={{ background: 'var(--t-bg-surface2)', color: 'var(--t-fg-secondary)' }}
      >
        A
      </div>
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
