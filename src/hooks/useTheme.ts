import { useEffect, type RefObject } from 'react'
import { useSettingsStore } from '../store/settingsStore.ts'
import { getTheme } from '../themes.ts'

export function useTheme({
  elementRef,
}: {
  elementRef?: RefObject<HTMLElement | null>
} = {}) {

  const activeTheme = useSettingsStore((s) => s.activeTheme)
  const setTheme = useSettingsStore((s) => s.setTheme)
  const cssVars = useSettingsStore((s) => s.config.cssVars)

  useEffect(() => {
    const def = getTheme(activeTheme)
    const el = elementRef?.current

    if (!el) return

    el.dataset.theme = def.id

    if (cssVars) {
      for (const [key, value] of Object.entries(cssVars)) {
        el.style.setProperty(key, value)
      }
    }
  }, [activeTheme, elementRef, cssVars])

  return { activeTheme, setTheme }
}
