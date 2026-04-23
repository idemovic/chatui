import { useState, useRef, useCallback } from 'react'
import { Trans } from 'react-i18next'

interface Props {
  onSend: (text: string) => void
  disabled?: boolean
  placeholder?: string
  allowFileUploads?: boolean
}

export function InputArea({ onSend, disabled, placeholder, allowFileUploads }: Props) {
  const [value, setValue] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const submit = useCallback(() => {
    const text = value.trim()
    if (!text || disabled) return
    onSend(text)
    setValue('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }, [value, disabled, onSend])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        submit()
      }
    },
    [submit],
  )

  const handleInput = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value)
    const el = e.target
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 180)}px`
  }, [])

  return (
    <div
      className="border-t"
      style={{ borderColor: 'var(--t-bg-border)', background: 'var(--t-bg-base)' }}
    >
    <div className="flex items-end gap-2 p-3">
      {allowFileUploads && (
        <button
          className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-fg-secondary hover:text-fg-primary hover:bg-bg-surface transition-colors"
          title="Attach file"
          tabIndex={-1}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />
          </svg>
        </button>
      )}

      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        placeholder={placeholder ?? 'Type a message… (Enter to send, Shift+Enter for newline)'}
        disabled={disabled}
        rows={1}
        className="flex-1 resize-none rounded-xl px-4 py-2.5 text-sm leading-relaxed focus:outline-none disabled:opacity-50 min-h-[42px]"
        style={{
          background: 'var(--t-bg-surface)',
          color: 'var(--t-fg-primary)',
          border: '1px solid var(--t-bg-border)',
        }}
      />

      <button
        onClick={submit}
        disabled={disabled || !value.trim()}
        className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        style={{ background: 'var(--t-accent)', color: 'var(--t-accent-fg)' }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M22 2 11 13" />
          <path d="m22 2-7 20-4-9-9-4 20-7z" />
        </svg>
      </button>
    </div>

    <div className="text-center text-[11px] pb-2 px-3 text-fg-muted">
      <Trans
        i18nKey="footer.poweredBy"
        components={{
          a: (
            <a
              href="https://www.elia-asistent.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
              style={{ color: 'inherit' }}
            />
          ),
        }}
      />
    </div>
    </div>
  )
}
