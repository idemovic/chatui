/** Per-language content overrides — keyed by language code e.g. "en", "sk" */
export interface LangOverride {
  /** Initial bot messages shown before the user sends anything */
  initialMessages?: string[]
  /** CTA popup text (window mode) */
  ctaText?: string
  /** Bot display name */
  botName?: string
  /** Welcome screen subtitle */
  welcomeSubtitle?: string
}

export interface ChatConfig {
  webhookUrl: string
  webhookConfig?: {
    method?: 'POST' | 'GET'
    headers?: Record<string, string>
  }
  chatInputKey?: string
  chatSessionKey?: string
  metadata?: Record<string, unknown>
  showWelcomeScreen?: boolean
  defaultLanguage?: string
  /** Global fallback initial messages — per-language overrides live in i18n[lang].initialMessages */
  initialMessages?: string[]
  allowFileUploads?: boolean
  allowedFilesMimeTypes?: string
  /** Per-language content: initial messages, CTA text, bot name, welcome subtitle */
  i18n?: Record<string, LangOverride>
  // Extended options
  streaming?: boolean
  botName?: string
  theme?: string
  showSidebar?: boolean
  mode?: 'window' | 'fullscreen' | 'mixed'
  // CTA popup (window mode only)
  showCta?: boolean
  ctaText?: string
  ctaDelay?: number
  ctaSound?: boolean
  /** Hide the built-in settings UI (gear button, theme picker, settings modal). */
  hideSettings?: boolean
  /** Bot avatar. Built-in id (e.g. 'amara'), URL, or data URL. */
  botAvatar?: string
  /** Popup toggle button icon (window mode). Built-in id, URL, or data URL. */
  toggleButtonIcon?: string
  // "Powered by" footer
  /** Link text shown after the localized "Powered by" prefix. Default: 'ELIA AI Assistant'. */
  poweredByLabel?: string
  /** Link target URL. Default: 'https://www.elia-asistent.com'. */
  poweredByUrl?: string
  /** Hide the entire "Powered by" footer line. */
  poweredByHide?: boolean
  /** In fullscreen layout, present the chat as a bottom sheet (rounded top, drag handle, dimmed
   *  backdrop above) instead of fully covering the viewport. Applies to mode 'fullscreen' and to
   *  'mixed' on mobile. Default: false. */
  fullscreenSheet?: boolean
  /** Sheet height as a CSS length (vh, %, px). Default: '75vh'. */
  fullscreenSheetHeight?: string
}

export interface Message {
  id: string
  role: 'user' | 'bot'
  content: string
  ts: number
}

export interface Session {
  id: string
  title: string
  createdAt: number
}

export interface ThemeDef {
  id: string
  label: string
  scheme: 'dark' | 'light'
  vars: ThemeVars
}

export interface ThemeVars {
  bgBase: string
  bgSurface: string
  bgSurface2: string
  bgBorder: string
  accent: string
  accentFg: string
  fgPrimary: string
  fgSecondary: string
  fgMuted: string
  userBubble: string
  userBubbleFg: string
}
