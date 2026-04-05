import { themes } from '../themes.ts'
import { useTheme } from '../hooks/useTheme.ts'

export function ThemePicker() {
  const { activeTheme, setTheme } = useTheme()

  return (
    <div className="flex flex-wrap gap-2 p-3">
      {themes.map((t) => (
        <button
          key={t.id}
          title={t.label}
          onClick={() => setTheme(t.id)}
          className="relative w-7 h-7 rounded-full transition-transform hover:scale-110 focus:outline-none"
          style={{ background: t.vars.accent }}
        >
          {activeTheme === t.id && (
            <span
              className="absolute inset-0 rounded-full"
              style={{
                boxShadow: `0 0 0 2px ${t.vars.bgBase}, 0 0 0 4px ${t.vars.accent}`,
              }}
            />
          )}
        </button>
      ))}
    </div>
  )
}
