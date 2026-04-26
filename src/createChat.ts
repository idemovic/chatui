import { createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { App } from './App.tsx'
import { useSettingsStore } from './store/settingsStore.ts'
import type { ChatConfig } from './types/index.ts'

export interface CreateChatOptions extends Partial<ChatConfig> {
  /** CSS selector or DOM element where the chat will mount. */
  target: string | HTMLElement
  /** Initial UI language code (e.g. 'en', 'sk'). Same as setting `defaultLanguage` but applied immediately. */
  language?: string
}

export interface ChatInstance {
  /** Unmount the chat and detach React. */
  unmount(): void
}

/**
 * Mount the chat widget into the page without writing any React code.
 * Drop-in API mirrored on @n8n/chat for vanilla-JS / CDN consumers.
 *
 * @example
 * createChat({
 *   target: '#chat',
 *   webhookUrl: 'https://your-n8n.example.com/webhook/abc',
 *   mode: 'window',
 * })
 */
export function createChat(opts: CreateChatOptions): ChatInstance {
  const { target, language, ...config } = opts

  const el =
    typeof target === 'string'
      ? (document.querySelector(target) as HTMLElement | null)
      : target
  if (!el) {
    throw new Error(`[chatui] createChat: target "${String(target)}" not found`)
  }

  const store = useSettingsStore.getState()
  store.setConfig(config as Partial<ChatConfig>)
  if (config.theme) store.setTheme(config.theme)
  const lang = language ?? config.defaultLanguage
  if (lang) store.setLanguage(lang)

  const root: Root = createRoot(el)
  root.render(createElement(App))

  return {
    unmount() {
      root.unmount()
    },
  }
}
