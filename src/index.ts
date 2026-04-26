// Public entry. Side-effect imports (i18n init, CSS) come in via App.tsx.
export { App } from './App.tsx'
export { createChat } from './createChat.ts'
export type { CreateChatOptions, ChatInstance } from './createChat.ts'
export type {
  ChatConfig,
  LangOverride,
  Message,
  Session,
  ThemeDef,
  ThemeVars,
  NotificationItem,
  NotificationTag,
  NotificationTagVariant,
  FaqItem,
} from './types/index.ts'
