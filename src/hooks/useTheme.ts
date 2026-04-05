import { useEffect } from 'react'
import { useSettingsStore } from '../store/settingsStore.ts'
import { getTheme } from '../themes.ts'

export function useTheme() {
  const activeTheme = useSettingsStore((s) => s.activeTheme)
  const setTheme = useSettingsStore((s) => s.setTheme)

  useEffect(() => {
    const def = getTheme(activeTheme)
    document.documentElement.dataset.theme = def.id
  }, [activeTheme])

  return { activeTheme, setTheme }
}
