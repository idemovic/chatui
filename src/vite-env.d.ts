/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Set to "true" to enable public mode: config loaded from VITE_CONFIG_URL, settings UI hidden. */
  readonly VITE_PUBLIC_MODE?: string
  /** URL of the runtime config JSON file. Defaults to "/chat-config.json". */
  readonly VITE_CONFIG_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
