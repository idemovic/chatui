// Public entry. Prefer createChat() - it builds the stores, the i18next instance and the
// providers for you. `App` is the raw component tree for React hosts that want to skip the
// shadow root; it must be wrapped in <I18nextProvider> + <StoreProvider>, which is why the
// store/i18n factories below are exported alongside it. See the README's "React app" section.
export { App } from './App.tsx'
export { createChat } from './createChat.tsx'
export type { CreateChatOptions, ChatInstance } from './createChat.tsx'
export { StoreProvider } from './store/StoreContext.tsx'
export { createSettingsStore } from './store/settingsStore.ts'
export { createChatStore } from './store/chatStore.ts'
export { createChatI18n } from './i18n.ts'
export type { SettingsState } from './store/settingsStore.ts'
export type { ChatState } from './store/chatStore.ts'
export type {
  ChatConfig,
  LangOverride,
  Message,
  Session,
  ThemeDef,
  NotificationItem,
  NotificationTag,
  NotificationTagVariant,
  FaqItem,
  Attachment,
} from './types/index.ts'
