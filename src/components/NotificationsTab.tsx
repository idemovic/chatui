import { useTranslation } from 'react-i18next'
import { useFeedJson } from '../hooks/useFeedJson.ts'
import type { NotificationItem, NotificationTag, NotificationTagVariant } from '../types/index.ts'

interface Props {
  feedUrl: string | undefined
  inlineItems: NotificationItem[] | undefined
}

export function NotificationsTab({ feedUrl, inlineItems }: Props) {
  const { t } = useTranslation()
  const { data, loading, error } = useFeedJson<NotificationItem>(feedUrl, inlineItems)

  if (loading) {
    return <Centered text={t('tabs.loading')} muted />
  }
  if (error) {
    return <Centered text={`${t('tabs.error')} (${error})`} />
  }
  if (data.length === 0) {
    return <Centered text={t('tabs.empty.notifications')} muted />
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
      {data.map((item, i) => (
        <Card key={item.id ?? i} item={item} />
      ))}
    </div>
  )
}

function Card({ item }: { item: NotificationItem }) {
  return (
    <div
      className="rounded-xl px-4 py-3"
      style={{
        background: 'var(--t-bg-surface)',
        border: '1px solid var(--t-bg-border)',
      }}
    >
      <div className="flex items-start gap-2 mb-1">
        <h3 className="flex-1 text-sm font-semibold text-fg-primary">{item.title}</h3>
        {item.tags?.map((tag, i) => <TagPill key={i} tag={tag} />)}
      </div>
      <p className="text-sm text-fg-secondary leading-relaxed whitespace-pre-line">
        {item.message}
      </p>
      {(item.date || item.cta) && (
        <div className="flex items-center justify-between mt-3 text-xs">
          <span className="text-fg-muted">{item.date ?? ''}</span>
          {item.cta && (
            <a
              href={item.cta.url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium hover:underline"
              style={{ color: 'var(--t-accent)' }}
            >
              {item.cta.title} <span aria-hidden>→</span>
            </a>
          )}
        </div>
      )}
    </div>
  )
}

function TagPill({ tag }: { tag: string | NotificationTag }) {
  const label = typeof tag === 'string' ? tag : tag.label
  const variant: NotificationTagVariant =
    typeof tag === 'string' ? 'neutral' : tag.variant ?? 'neutral'
  const styles = variantStyles(variant)
  return (
    <span
      className="inline-block px-2 py-0.5 rounded-md text-[11px] font-medium flex-shrink-0"
      style={styles}
    >
      {label}
    </span>
  )
}

function variantStyles(variant: NotificationTagVariant) {
  switch (variant) {
    case 'success':
      return { background: 'rgba(34, 197, 94, 0.15)', color: '#22c55e' }
    case 'warning':
      return { background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }
    case 'danger':
      return { background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }
    case 'neutral':
    default:
      return {
        background: 'var(--t-bg-surface2)',
        color: 'var(--t-fg-secondary)',
      }
  }
}

function Centered({ text, muted }: { text: string; muted?: boolean }) {
  return (
    <div className="flex-1 flex items-center justify-center px-4 py-12 text-sm text-center"
      style={{ color: muted ? 'var(--t-fg-muted)' : 'var(--t-fg-secondary)' }}
    >
      {text}
    </div>
  )
}
