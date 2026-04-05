import { useEffect } from 'react'
import { useSettingsStore } from '../store/settingsStore.ts'
import type { ChatConfig } from '../types/index.ts'

const CONFIG_URL = import.meta.env.VITE_CONFIG_URL ?? '/chat-config.json'

const PUBLIC_MODE = import.meta.env.VITE_PUBLIC_MODE === 'true'

/**
 * Fetches ChatConfig from CONFIG_URL and applies it to the store.
 * In dev mode (VITE_PUBLIC_MODE != "true") this is a no-op.
 * Safe to call unconditionally — the fetch is skipped when not in public mode.
 */
export function usePublicConfig() {
  const setConfig = useSettingsStore((s) => s.setConfig)
  const setTheme = useSettingsStore((s) => s.setTheme)
  const setLanguage = useSettingsStore((s) => s.setLanguage)

  useEffect(() => {
    if (!PUBLIC_MODE) return

    const urlLang = new URLSearchParams(location.search).get('lang')
    if (urlLang) setLanguage(urlLang)

    fetch(CONFIG_URL)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json() as Promise<ChatConfig>
      })
      .then((cfg) => {
        setConfig(cfg)
        if (cfg.theme) setTheme(cfg.theme)
        if (cfg.defaultLanguage) setLanguage(cfg.defaultLanguage)
      })
      .catch((err: unknown) => {
        console.warn(`[chatui] Could not load config from ${CONFIG_URL}:`, err)
      })
  // Run once on mount — store actions are stable, no deps needed
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}
