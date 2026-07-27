import { createRoot, type Root } from 'react-dom/client'
import { I18nextProvider } from 'react-i18next'
import type { i18n as I18nInstance } from 'i18next'
import { App } from './App.tsx'
import { createSettingsStore } from './store/settingsStore.ts'
import { createChatStore } from './store/chatStore.ts'
import { StoreProvider } from './store/StoreContext.tsx'
import { createChatI18n } from './i18n.ts'
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
  /** Isolates this instance's persisted settings/session storage (and in-memory config/theme/
   *  conversation state) from any other chatui instance mounted on the same page - e.g. a
   *  host's own floating widget alongside a page's embedded demo. Only needed when multiple
   *  instances can be mounted simultaneously; a single instance per page can omit it. */
  storageNamespace?: string
}

export interface ChatInstance {
  /** Unmount the chat and detach React. */
  unmount(): void
  /** Update the config without remounting. */
  setConfig(patch: Partial<ChatConfig>): void
  /** Switch the active theme without remounting. */
  setTheme(id: string): void
  /** Switch the UI language without remounting. */
  setLanguage(lang: string): void
  /** This instance's i18next instance, for registering extra UI languages at runtime via
   *  `addResourceBundle()`. The widget does not read the global i18next singleton, so a bundle
   *  registered there will not reach it - use this. `undefined` until the instance has mounted
   *  (only possible when createChat() was called before DOMContentLoaded). */
  readonly i18n: I18nInstance | undefined
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
  const { target, language, storageNamespace, ...config } = opts

  let el =
    typeof target === 'string'
      ? (document.querySelector(target) as HTMLElement | null)
      : target

  if (!el) {
    el = document.createElement('div')
    document.body.appendChild(el)
  }

  // Reuse an existing shadow root when present (React StrictMode runs effects twice,
  // so the second invocation must not call attachShadow again — it throws).
  const hadShadow = !!el.shadowRoot
  const shadow = hadShadow ? el.shadowRoot! : el.attachShadow({ mode: 'open' })

  // Remove any previous mount point so we start with a clean slate.
  shadow.querySelector('[data-chatui-mount]')?.remove()

  const mountTarget = document.createElement('div')
  mountTarget.setAttribute('data-chatui-mount', '')
  if (config.mode === 'embedded') {
    mountTarget.style.cssText = 'height:100%;display:flex;flex-direction:column'
  }
  shadow.appendChild(mountTarget)

  if (!hadShadow) {
    injectCSS({ target: shadow })
  }

  // Each instance gets its own i18next instance and zustand stores, so two instances mounted
  // on the same page (a host's own widget alongside a page's embedded demo) never share
  // config, theme, UI language, or conversation state.
  const i18nInstance = createChatI18n(storageNamespace)
  const settingsStore = createSettingsStore(i18nInstance, storageNamespace)
  const chatStore = createChatStore(storageNamespace)

  // initConfig (not setConfig): defaults + opts REPLACE any persisted config, so options the
  // host removed since the visitor's last session don't linger from localStorage.
  settingsStore.getState().initConfig(config as Partial<ChatConfig>)
  if (config.theme) settingsStore.getState().setTheme(config.theme)
  if (language) settingsStore.getState().setLanguage(language)

  const root: Root = createRoot(mountTarget)
  root.render(
    <I18nextProvider i18n={i18nInstance}>
      <StoreProvider
        settingsStore={settingsStore}
        chatStore={chatStore}
        storageNamespace={storageNamespace}
      >
        <App />
      </StoreProvider>
    </I18nextProvider>,
  )

  return {
    i18n: i18nInstance,
    unmount() {
      // Defer so that React StrictMode's synchronous cleanup doesn't try to
      // unmount a root while React is still in the middle of rendering.
      setTimeout(() => root.unmount(), 0)
    },
    setConfig(patch: Partial<ChatConfig>) {
      settingsStore.getState().setConfig(patch)
    },
    setTheme(id: string) {
      settingsStore.getState().setTheme(id)
    },
    setLanguage(lang: string) {
      settingsStore.getState().setLanguage(lang)
    },
  }
}

export function createChat(opts: CreateChatOptions): ChatInstance {
  if (document.readyState === 'loading') {
    let instance: ChatInstance | undefined
    window.addEventListener('DOMContentLoaded', () => { instance = createChatInner(opts) }, { once: true })
    return {
      get i18n() { return instance?.i18n },
      unmount() { instance?.unmount() },
      setConfig(patch: Partial<ChatConfig>) { instance?.setConfig(patch) },
      setTheme(id: string) { instance?.setTheme(id) },
      setLanguage(lang: string) { instance?.setLanguage(lang) },
    }
  }
  return createChatInner(opts)
}
