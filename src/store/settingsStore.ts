import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ChatConfig } from '../types/index.ts'
import { defaultThemeId } from '../themes.ts'

interface SettingsState {
  config: ChatConfig
  activeTheme: string
  language: string

  setConfig(patch: Partial<ChatConfig>): void
  setTheme(id: string): void
  setLanguage(lang: string): void
}

const defaultConfig: ChatConfig = {
  webhookUrl: '',
  chatInputKey: 'chatInput',
  chatSessionKey: 'sessionId',
  mode: 'fullscreen',
  showSidebar: false,
  showWelcomeScreen: true,
  streaming: false,
  botName: 'Assistant',
  showCta: true,
  ctaText: 'Hi! How can I help you today?',
  ctaDelay: 5000,
  ctaSound: true,
  hideSettings: true,
  i18n: {
    en: { initialMessages: [], ctaText: 'Hi! How can I help you today?' },
    sk: { initialMessages: [], ctaText: 'Dobrý deň! Ako vám môžem pomôcť?' },
  },
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      config: defaultConfig,
      activeTheme: defaultThemeId,
      language: 'en',

      setConfig(patch) {
        set((s) => ({ config: { ...s.config, ...patch } }))
      },

      setTheme(id) {
        set({ activeTheme: id })
      },

      setLanguage(lang) {
        set({ language: lang })
        // Sync i18next lazily — import to avoid circular deps at module init time
        void import('../i18n.ts').then((mod) => {
          void mod.default.changeLanguage(lang)
        })
      },
    }),
    {
      name: 'chatui-settings',
    },
  ),
)
