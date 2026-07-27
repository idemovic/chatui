import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { i18n as I18nInstance } from 'i18next'
import type { ChatConfig } from '../types/index.ts'
import { defaultThemeId } from '../themes.ts'
import { scopedKey } from '../lib/storage.ts'

export interface SettingsState {
  config: ChatConfig
  activeTheme: string
  language: string

  setConfig(patch: Partial<ChatConfig>): void
  initConfig(opts: Partial<ChatConfig>): void
  setTheme(id: string): void
  setLanguage(lang: string): void
}

const defaultConfig: ChatConfig = {
  webhookUrl: '',
  chatInputKey: 'chatInput',
  chatSessionKey: 'sessionId',
  mode: 'window',
  showWelcomeScreen: true,
  streaming: false,
  allowFileUploads: false,
  botName: 'Bot',
  showCta: true,
  ctaText: 'Hi! How can I help you today?',
  ctaDelay: 5000,
  ctaSound: true,
  hideSettings: true,
  fullscreenSheet: false,
  fullscreenSheetHeight: '75vh',
  i18n: {
    en: { initialMessages: [], ctaText: 'Hi! How can I help you today?' },
    sk: { initialMessages: [], ctaText: 'Dobrý deň! Ako vám môžem pomôcť?' },
  },
}

/**
 * Creates one createChat() instance's settings store. Each instance gets its own store (see
 * StoreContext.tsx) so simultaneous instances on the same page don't share config/theme.
 * `namespace` scopes the localStorage key so simultaneous instances don't persist over each
 * other either; omit it to keep the default key (matches pre-multi-instance behaviour for the
 * common single-widget-per-page case).
 */
export function createSettingsStore(i18nInstance: I18nInstance, namespace?: string) {
  return create<SettingsState>()(
    persist(
      (set) => ({
        config: defaultConfig,
        activeTheme: defaultThemeId,
        language: 'en',

        setConfig(patch) {
          set((s) => ({ config: { ...s.config, ...patch } }))
        },

        // Boot-time reset, called once per createChat() mount. Unlike setConfig it does NOT
        // merge over the rehydrated persisted config: the host's opts + defaults are the whole
        // config, so an option the host removed (e.g. allowFileUploads) actually turns off for
        // returning visitors instead of lingering in their localStorage forever.
        initConfig(opts) {
          set({ config: { ...defaultConfig, ...opts } })
        },

        setTheme(id) {
          set({ activeTheme: id })
        },

        setLanguage(lang) {
          set({ language: lang })
          void i18nInstance.changeLanguage(lang)
        },
      }),
      {
        name: scopedKey('chatui-settings', namespace),
        // Deep-merge so newly-added default config fields appear for existing users
        // (Zustand's default merge replaces top-level keys, dropping new defaults inside `config`).
        merge: (persisted, current) => {
          const p = persisted as Partial<SettingsState>
          return {
            ...current,
            ...p,
            config: { ...current.config, ...(p.config ?? {}) },
          }
        },
      },
    ),
  )
}
