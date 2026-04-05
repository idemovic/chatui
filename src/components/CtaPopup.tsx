interface Props {
  text: string
  onDismiss: () => void
}

export function CtaPopup({ text, onDismiss }: Props) {
  return (
    <div
      className="absolute bottom-2 right-0 mb-2 w-64 cta-bubble rounded-2xl px-4 py-3 shadow-xl text-sm"
      style={{
        background: 'var(--t-bg-surface)',
        border: '1px solid var(--t-bg-border)',
        color: 'var(--t-fg-primary)',
      }}
    >
      <button
        onClick={onDismiss}
        className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center text-fg-muted hover:text-fg-primary transition-colors text-base leading-none"
        aria-label="Dismiss"
      >
        ×
      </button>
      <p className="pr-5 leading-snug">{text}</p>
    </div>
  )
}
