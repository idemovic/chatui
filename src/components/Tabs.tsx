interface Tab {
  id: string
  label: string
  icon?: 'bulb' | 'book' | 'chat'
}

interface Props {
  tabs: Tab[]
  activeId: string
  onChange: (id: string) => void
}

export function Tabs({ tabs, activeId, onChange }: Props) {
  return (
    <div
      className="flex gap-1 px-3 pt-3 pb-2 flex-shrink-0 border-b"
      style={{
        background: 'var(--t-bg-base)',
        borderColor: 'var(--t-bg-border)',
      }}
    >
      {tabs.map((tab) => {
        const isActive = activeId === tab.id
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors"
            style={
              isActive
                ? {
                    background: 'var(--t-bg-surface)',
                    color: 'var(--t-fg-primary)',
                    border: '1px solid var(--t-bg-border)',
                  }
                : {
                    background: 'transparent',
                    color: 'var(--t-fg-secondary)',
                    border: '1px solid transparent',
                  }
            }
          >
            {tab.icon && <TabIcon name={tab.icon} />}
            <span>{tab.label}</span>
          </button>
        )
      })}
    </div>
  )
}

function TabIcon({ name }: { name: 'bulb' | 'book' | 'chat' }) {
  const common = {
    width: 14,
    height: 14,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  }
  if (name === 'bulb') {
    return (
      <svg {...common}>
        <path d="M9 18h6" />
        <path d="M10 22h4" />
        <path d="M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.3 1 2.1v.2h6v-.2c0-.8.4-1.6 1-2.1A7 7 0 0 0 12 2z" />
      </svg>
    )
  }
  if (name === 'book') {
    return (
      <svg {...common}>
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
      </svg>
    )
  }
  return (
    <svg {...common}>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  )
}
