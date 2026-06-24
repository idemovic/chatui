import { createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { App } from './App.tsx'
import { useSettingsStore } from './store/settingsStore.ts'
import type { ChatConfig } from './types/index.ts'
import { injectCSS } from 'virtual:css-injected-by-js'

export interface CreateChatOptions extends Partial<ChatConfig> {
  /** CSS selector or DOM element where the chat will mount.
   *  If omitted (or the selector does not match anything), a `<div>` is
   *  automatically created, appended to `<body>`, and the shadow root is
   *  attached to that div. */
  target?: string | HTMLElement
  /** Initial UI language code (e.g. 'en', 'sk'). Applied immediately via `setLanguage()`. */
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
function createChatInner(opts: CreateChatOptions): ChatInstance {
  const { target, language, ...config } = opts

  let el =
    typeof target === 'string'
      ? (document.querySelector(target) as HTMLElement | null)
      : target

  let mountTarget: HTMLElement

  if (!el) {
    el = document.createElement('div')
    document.body.appendChild(el)
  } 

  const shadow = el.attachShadow({ mode: 'open' })
  mountTarget = document.createElement('div')
  shadow.appendChild(mountTarget)
  injectCSS({ target: shadow })

  const store = useSettingsStore.getState()
  store.setConfig(config as Partial<ChatConfig>)
  if (config.theme) store.setTheme(config.theme)
  if (language) store.setLanguage(language)

  const root: Root = createRoot(mountTarget)
  root.render(createElement(App))

  return {
    unmount() {
      root.unmount()
    },
  }
}

export function createChat(opts: CreateChatOptions): ChatInstance {
  if (document.readyState === 'loading') {
    let instance: ChatInstance | undefined
    window.addEventListener('DOMContentLoaded', () => { instance = createChatInner(opts) }, { once: true })
    return { unmount() { instance?.unmount() } }
  }
  return createChatInner(opts)
}
