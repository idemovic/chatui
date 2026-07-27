interface Props {
  text: string
  onDismiss: () => void
  align?: 'right' | 'left'
}

export function CtaPopup({ text, onDismiss, align = 'right' }: Props) {
  return (
    <div
      className={`absolute bottom-2 mb-2 w-64 cta-bubble rounded-2xl px-4 py-3 shadow-xl text-sm ${align === 'left' ? 'left-0' : 'right-0'}`}
      style={{
        background: 'var(--t-bg-surface)',
        border: '1px solid var(--t-bg-border)',
        color: 'var(--t-fg-primary)',
      }}
    >
      <button
        onClick={onDismiss}
        className="absolute inset-y-0 my-auto right-2 w-5 h-5 rounded-full flex items-center justify-center text-fg-muted hover:text-fg-primary transition-colors text-base leading-none"
        aria-label="Dismiss"
      >
        ×
      </button>
      <p className="pr-5 leading-snug whitespace-pre-line">{text}</p>
    </div>
  )
}