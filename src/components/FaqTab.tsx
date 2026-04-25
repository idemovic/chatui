import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useFeedJson } from '../hooks/useFeedJson.ts'
import type { FaqItem } from '../types/index.ts'

interface Props {
  feedUrl: string | undefined
  inlineItems: FaqItem[] | undefined
}

export function FaqTab({ feedUrl, inlineItems }: Props) {
  const { t } = useTranslation()
  const { data, loading, error } = useFeedJson<FaqItem>(feedUrl, inlineItems)
  const [query, setQuery] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return data
    return data.filter((item) => {
      const haystack = `${item.question} ${item.answer} ${item.category ?? ''}`.toLowerCase()
      return haystack.includes(q)
    })
  }, [data, query])

  if (loading) {
    return (
      <div className="flex-1 flex flex-col">
        <SearchBar value={query} onChange={setQuery} placeholder={t('tabs.faqSearch')} />
        <Centered text={t('tabs.loading')} muted />
      </div>
    )
  }
  if (error) {
    return (
      <div className="flex-1 flex flex-col">
        <SearchBar value={query} onChange={setQuery} placeholder={t('tabs.faqSearch')} />
        <Centered text={`${t('tabs.error')} (${error})`} />
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <SearchBar value={query} onChange={setQuery} placeholder={t('tabs.faqSearch')} />
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {filtered.length === 0 ? (
          <Centered text={t('tabs.empty.faq')} muted />
        ) : (
          filtered.map((item, i) => {
            const id = item.id ?? `${i}-${item.question}`
            const isOpen = expanded === id
            return (
              <div
                key={id}
                className="rounded-xl"
                style={{
                  background: 'var(--t-bg-surface)',
                  border: '1px solid var(--t-bg-border)',
                }}
              >
                <button
                  onClick={() => setExpanded(isOpen ? null : id)}
                  className="w-full flex items-start gap-2 px-4 py-3 text-left"
                >
                  <span className="flex-1 text-sm font-semibold text-fg-primary">
                    {item.question}
                  </span>
                  <Chevron open={isOpen} />
                </button>
                {isOpen && (
                  <div
                    className="px-4 pb-3 text-sm text-fg-secondary leading-relaxed whitespace-pre-line"
                    style={{ borderTop: '1px solid var(--t-bg-border)', paddingTop: '0.75rem' }}
                  >
                    {item.answer}
                    {item.category && (
                      <div className="mt-3">
                        <span
                          className="inline-block px-2 py-0.5 rounded-md text-[11px] font-medium"
                          style={{
                            background: 'var(--t-bg-surface2)',
                            color: 'var(--t-fg-secondary)',
                          }}
                        >
                          {item.category}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

function SearchBar({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (v: string) => void
  placeholder: string
}) {
  return (
    <div className="px-4 pt-3 pb-2 flex-shrink-0" style={{ background: 'var(--t-bg-base)' }}>
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--t-fg-muted)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3-3" />
        </svg>
        <input
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-9 pr-3 py-2 rounded-lg text-sm focus:outline-none"
          style={{
            background: 'var(--t-bg-surface)',
            color: 'var(--t-fg-primary)',
            border: '1px solid var(--t-bg-border)',
          }}
        />
      </div>
    </div>
  )
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{
        color: 'var(--t-fg-muted)',
        transform: open ? 'rotate(180deg)' : 'rotate(0)',
        transition: 'transform .15s',
        flexShrink: 0,
        marginTop: '2px',
      }}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}

function Centered({ text, muted }: { text: string; muted?: boolean }) {
  return (
    <div
      className="flex-1 flex items-center justify-center px-4 py-12 text-sm text-center"
      style={{ color: muted ? 'var(--t-fg-muted)' : 'var(--t-fg-secondary)' }}
    >
      {text}
    </div>
  )
}
