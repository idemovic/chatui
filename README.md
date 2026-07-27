# @elia-assistant/chatui

A polished, self-contained chat widget built for [Elia Assistant](https://elia-asistent.com), compatible with [n8n](https://n8n.io)'s Chat Trigger.
Drop it in front of any n8n AI Agent workflow — no backend code needed.

Ships as a pre-built ESM bundle and a CDN-ready IIFE bundle. Config-compatible with [@n8n/chat](https://www.npmjs.com/package/@n8n/chat).

---

## Install

### React app (bundler)

```bash
npm install @elia-assistant/chatui
```

```tsx
// src/ChatWidget.tsx
import { useEffect, useRef } from 'react'
import { createChat, type ChatInstance } from '@elia-assistant/chatui'

export function ChatWidget() {
  const containerRef = useRef<HTMLDivElement>(null)
  const instanceRef = useRef<ChatInstance | null>(null)

  useEffect(() => {
    if (!containerRef.current || instanceRef.current) return
    instanceRef.current = createChat({
      target: containerRef.current,
      webhookUrl: 'https://your-n8n.example.com/webhook/abc',
      mode: 'window',
    })
    return () => {
      // Deferred so StrictMode's double-invoke doesn't unmount mid-render.
      const instance = instanceRef.current
      instanceRef.current = null
      setTimeout(() => instance?.unmount(), 0)
    }
  }, [])

  return <div ref={containerRef} style={{ height: '100%' }} />
}
```

`createChat()` mounts into a shadow root, so the widget's CSS is fully isolated from your app's.

The host's `vite.config.ts` needs `optimizeDeps.exclude: ['@elia-assistant/chatui']` so Vite doesn't re-bundle the already-bundled package. See [example.html](./example.html) for the full integration guide.

#### Raw component tree (no shadow root)

If you need the widget inside your own React tree rather than a shadow root, render `<App />` directly. It reads its stores and translations from context, so you must build them and supply both providers:

```tsx
import { I18nextProvider } from 'react-i18next'
import {
  App,
  StoreProvider,
  createChatI18n,
  createSettingsStore,
  createChatStore,
} from '@elia-assistant/chatui'

// Create these once, outside the component - not on every render.
const i18n = createChatI18n()
const settingsStore = createSettingsStore(i18n)
const chatStore = createChatStore()

settingsStore.getState().setConfig({
  webhookUrl: 'https://your-n8n.example.com/webhook/abc',
  mode: 'window',
})

export function ChatWidget() {
  return (
    <I18nextProvider i18n={i18n}>
      <StoreProvider settingsStore={settingsStore} chatStore={chatStore}>
        <App />
      </StoreProvider>
    </I18nextProvider>
  )
}
```

Without both providers `<App />` throws `useSettingsStore must be used within a <StoreProvider>`. Note that this path does not inject the widget's CSS for you - prefer `createChat()` unless you specifically need to avoid the shadow root.

### Plain HTML (CDN, no bundler)

```html
<script src="https://cdn.jsdelivr.net/npm/@elia-assistant/chatui/dist/chatui.iife.js"></script>
<div id="chat"></div>
<script>
  Chatui.createChat({
    target: '#chat',
    webhookUrl: 'https://your-n8n.example.com/webhook/abc',
    mode: 'window',
  })
</script>
```

`unpkg.com` works too: `https://unpkg.com/@elia-assistant/chatui/dist/chatui.iife.js`.

### Vanilla JS (bundler, no React)

```ts
import { createChat } from '@elia-assistant/chatui'

const instance = createChat({
  target: '#chat',
  webhookUrl: '...',
  mode: 'window',
})

instance.setConfig({ botName: 'Support' })  // patch config without remounting
instance.setTheme('cosmos')
instance.setLanguage('sk')
instance.unmount()                          // remove
```

### Multiple widgets on one page

Every `createChat()` call gets its own config, theme, language and conversation state, so two widgets never fight over each other's settings. They do share `localStorage`, though - pass `storageNamespace` to keep their persisted state apart:

```ts
createChat({ target: '#support', webhookUrl: '...' })
createChat({ target: '#demo', webhookUrl: '...', storageNamespace: 'demo' })
```

Omit `storageNamespace` for the single-widget case and the default storage keys are used, so existing installs keep their saved settings and history.

---

## Features

- **n8n webhook compatible** — same parameters as `@n8n/chat`; works with any Chat Trigger out of the box
- **Three display modes** — `fullscreen`, `window` (floating button + popup), or `mixed` (window on desktop, fullscreen on mobile)
- **Left/right positioning** — `position: 'left'` anchors the floating button and chat window to the left side of the screen
- **Bottom-sheet style** — opt-in `fullscreenSheet` mode covers ~3/4 of the screen with a rounded top instead of going edge-to-edge
- **Optional tabs** — surface a Notifications feed (URL or inline JSON) and a searchable FAQ alongside the chat
- **SSE streaming** — optional word-by-word bot responses
- **16 built-in themes** — Sunrise, Ivory, Cherry, Sky, Lavender, Nice, Navy, Amber, Slate, Graphite, Stone, Cosmos, Forest, Ocean, Cherry Dark, Midnight; switch at runtime
- **30 built-in avatars** + file upload (max 500 KB) or URL — same picker for the floating button icon
- **CTA popup** — timed speech-bubble with optional Web Audio notification, window mode only
- **Conversation history** — optional sidebar with persistent multi-session history
- **Per-language content** — initial messages, bot name, CTA text, welcome subtitle, tab titles, all configurable per language
- **Multilingual UI** — English and Slovak bundled; extend via `instance.i18n.addResourceBundle` at runtime
- **Markdown rendering** — bot messages render full GFM via `react-markdown`
- **Configurable "Powered by" footer** — change the link text/URL or hide it entirely
- **Persistent settings** — config + theme + language survive page reloads (`localStorage`)
- **Multi-instance safe** — every `createChat()` call is fully isolated; `storageNamespace` separates their persisted state too
- **Lockable UI** — `hideSettings: true` removes the gear, theme picker, and settings modal (default for npm consumers)
- **Export config** — generate ready-to-paste host code from the settings modal

---

## Configuration

All options live on `ChatConfig`. Pass them to `createChat()`, or patch them later via `instance.setConfig()`.

### Required

| Parameter | Type | Description |
|---|---|---|
| `webhookUrl` | `string` | n8n Chat Trigger production URL |

### Webhook transport

| Parameter | Type | Default | Description |
|---|---|---|---|
| `webhookConfig.method` | `'POST' \| 'GET'` | `'POST'` | HTTP method |
| `webhookConfig.headers` | `Record<string,string>` | — | Extra request headers |
| `chatInputKey` | `string` | `'chatInput'` | Body key for the user message |
| `chatSessionKey` | `string` | `'sessionId'` | Body key for the session ID |
| `metadata` | `object` | — | Extra fields merged into every request body |
| `streaming` | `boolean` | `false` | Parse the response as Server-Sent Events |

### Layout

| Parameter | Type | Default | Description |
|---|---|---|---|
| `mode` | `'fullscreen' \| 'window' \| 'mixed'` | `'window'` | Display mode |
| `position` | `'right' \| 'left'` | `'right'` | Side of the screen the floating widget is anchored to (window / mixed mode) |
| `fullscreenSheet` | `boolean` | `false` | Render fullscreen as a bottom sheet (rounded top, dimmed backdrop) |
| `fullscreenSheetHeight` | `string` | `'75vh'` | Sheet height as any CSS length |
| `showWelcomeScreen` | `boolean` | `true` | Show welcome screen when no messages |
| `allowFileUploads` | `boolean` | `false` | Show file attachment button |

### Appearance

| Parameter | Type | Default | Description |
|---|---|---|---|
| `theme` | `string` | `'midnight'` | Initial theme ID |
| `botName` | `string` | `'Assistant'` | Global bot display name |
| `botAvatar` | `string` | — | Built-in avatar id, URL, or data URL |
| `toggleButtonIcon` | `string` | — | Image inside the floating button (window mode) |

### CTA popup (window mode only)

| Parameter | Type | Default | Description |
|---|---|---|---|
| `showCta` | `boolean` | `true` | Show CTA speech-bubble after delay |
| `ctaText` | `string` | `'Hi! How can I help you today?'` | Global fallback CTA text |
| `ctaDelay` | `number` | `5000` | Milliseconds before CTA appears |
| `ctaSound` | `boolean` | `true` | Play a Web Audio chime when CTA shows |

### Tabs (optional, opt-in)

| Parameter | Type | Description |
|---|---|---|
| `tabs.notifications.feedUrl` | `string` | JSON URL returning `{ items: NotificationItem[] }` |
| `tabs.notifications.items` | `NotificationItem[]` | Inline items (used when `feedUrl` unset) |
| `tabs.notifications.title` | `string` | Tab label override |
| `tabs.help.feedUrl` | `string` | JSON URL returning `{ items: FaqItem[] }` |
| `tabs.help.items` | `FaqItem[]` | Inline FAQ items |
| `tabs.help.title` | `string` | Tab label override |
| `tabs.chat.title` | `string` | Chat tab label override |

A tab is shown only if its block has `feedUrl` or `items`. If neither tab is configured, no tab bar renders.

### UI lock

| Parameter | Type | Default | Description |
|---|---|---|---|
| `hideSettings` | `boolean` | `true` | Hide the gear, theme picker, and settings modal |

### i18n

| Parameter | Type | Description |
|---|---|---|
| `initialMessages` | `string[]` | Global fallback initial bot messages |
| `i18n[lang]` | `LangOverride` | Per-language content overrides |

To set the initial UI language, pass `language: 'sk'` to `createChat()` (or call `instance.setLanguage('sk')` later). On a fresh browser, the default falls back to `navigator.language` then `'en'`.

`LangOverride` fields: `initialMessages`, `ctaText`, `botName`, `welcomeSubtitle`, `tabs.{notifications,help,chat}.title`.

Resolution chain: `i18n[activeLang].X` -> `i18n['en'].X` -> global `config.X`.

---

## Themes

| ID | Name | Style | Accent |
|---|---|---|---|
| `sunrise` | Sunrise | Light | Orange `#f97316` |
| `ivory` | Ivory | Light | Indigo `#4338ca` |
| `cherry` | Cherry | Light | Red `#ef4444` |
| `sky` | Sky | Light | Blue `#5ba1da` |
| `lavender` | Lavender | Light | Violet `#8b5cf6` |
| `nice` | Nice | Light | Cyan `#3f7e83` |
| `navy` | Navy | Light | Blue `#ebf3f2` |
| `amber` | Amber | Dark | Amber `#f59e0b` |
| `slate` | Slate | Light | Blue `#38bdf8` |
| `graphite` | Graphite | Blue `#4185eb` |
| `stone` | Stone | Light | Orange `#fbbf24` |
| `cosmos` | Cosmos | Dark | Purple `#a855f7` |
| `forest` | Forest | Dark | Green `#22c55e` |
| `ocean` | Ocean | Dark | Cyan `#06b6d4` |
| `cherryDark` | Cherry Dark | Dark | Red `#ef4444` |
| `midnight` | Midnight | Dark | Indigo `#6366f1` |

Defined in `src/themes.ts` — add your own by appending to the array.

---

## n8n setup

1. Add a **Chat Trigger** node to your workflow.
2. Copy the **Production URL**.
3. Set it as `config.webhookUrl`.
4. Make sure the workflow is **Active**.

Request body sent by chatui:

```json
{
  "chatInput": "user message text",
  "sessionId": "abc123",
  "language": "en",
  "...": "anything in config.metadata"
}
```

Expected non-streaming response:

```json
{ "output": "bot reply text" }
```

For SSE streaming, set `config.streaming: true` and have your workflow emit `text/event-stream`:

```
data: {"text": "chunk"}
```

---

## Tabs (Notifications + FAQ)

Two extra panes alongside chat — fully optional. Each accepts a `feedUrl` (JSON over HTTP) or `items` (inline array; useful for development).

**Notifications JSON:**
```json
{
  "items": [
    {
      "title": "Lehota na podanie DPH",
      "message": "Tvoje daňové priznanie...",
      "tags": [{ "label": "High", "variant": "danger" }],
      "date": "2025-07-11",
      "cta": { "url": "https://example.com", "title": "Read more" }
    }
  ]
}
```

**FAQ JSON:**
```json
{
  "items": [
    { "question": "How do I X?", "answer": "You do Y.", "category": "Setup" }
  ]
}
```

The FAQ tab includes a search box that filters by case-insensitive substring across `question + answer + category`.

---

## Adding a language at runtime

Bundled languages: `en`, `sk` (split into `dist/chunks/translation-*.js`, lazy-loaded).
To add another without rebuilding chatui, register the bundle yourself:

Each instance owns a private i18next instance, exposed as `instance.i18n`. Register the bundle there - a bundle added to the global `i18next` singleton will not reach the widget:

```ts
const instance = createChat({ target: '#chat', webhookUrl: '...' })

instance.i18n?.addResourceBundle('fr', 'translation', {
  welcome:  { subtitle: 'Commencez une conversation.' },
  input:    { placeholder: 'Tapez un message...' },
  // ...full keys: see node_modules/@elia-assistant/chatui/dist/chunks/translation-*.js
})

instance.setLanguage('fr')
```

`instance.i18n` is `undefined` only when `createChat()` was called before `DOMContentLoaded` and the widget has not mounted yet.

Then any per-language overrides live under `config.i18n.fr`.

---

## Settings UI

Hidden by default for npm consumers — configuration is expected to live in code. Flip `hideSettings: false` to expose the gear, theme picker, and settings modal (handy for admin dashboards, internal tools, live demos):

```ts
createChat({
  target:       '#chat',
  webhookUrl:   '...',
  hideSettings: false,
})
```

The settings modal includes an **Export config** button that generates the exact `instance.setConfig()` call for pasting into a host project.

The chatui repo's own `npm run dev` unlocks the UI automatically.

---

## Local development

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # ESM bundle + IIFE bundle + .d.ts files into dist/
npm run pack:dry     # preview the npm tarball contents
```

Build output:
- `dist/index.js` — ESM, React externalized as peer dep (~325 kB / 75 kB gzipped)
- `dist/chatui.iife.js` — single-file IIFE for `<script>` tags, React + ReactDOM bundled in (~485 kB / 144 kB gzipped, production-mode)
- `dist/**/*.d.ts` — TypeScript declarations
- `dist/chunks/translation-*.js` — code-split locale bundles

CSS is inlined into the JS bundles and injected into a shadow root at mount time — no `.css` file is emitted and host pages don't need to load one.

To smoke-test the IIFE locally without publishing:
```bash
npm run build
npx serve . -l 5173
# open http://localhost:5173/vanilla-test.html
```

See [example.html](./example.html) for the full integration guide and [vanilla-test.html](./vanilla-test.html) for a CDN-style smoke test.

---

## Tech stack

| Concern | Library |
|---|---|
| Build | Vite 8 + Rolldown + `@vitejs/plugin-react` |
| Styling (internal) | Tailwind CSS v4 — inlined into the JS bundle and injected into a shadow root at mount time; consumers don't load any CSS |
| State | Zustand 5 with `persist` middleware |
| Markdown | `react-markdown` + `remark-gfm` |
| i18n | `react-i18next` + `i18next-resources-to-backend` (locales code-split, no HTTP fetch) |
| HTTP / SSE | Native `fetch` |

React 19 is a peer dependency for the ESM bundle. The IIFE bundle includes React + ReactDOM.

---

## Migrating from 1.x

2.0 removed the module-level global stores. Each `createChat()` call now owns its config, theme, language and conversation state, which is what makes multiple widgets on one page possible. `createChat()` itself is unchanged, so **CDN / `Chatui.createChat()` integrations need no changes** - and the default `localStorage` keys are unchanged, so saved settings and chat history carry over.

What did change:

| 1.x | 2.0 |
|---|---|
| `import { useSettingsStore } from '@elia-assistant/chatui/store'` | removed - use the `createChat()` instance |
| `useSettingsStore.getState().setConfig({...})` | `instance.setConfig({...})`, or pass the options to `createChat()` |
| `useSettingsStore.getState().setTheme(id)` | `instance.setTheme(id)` |
| `useSettingsStore.getState().setLanguage(lang)` | `instance.setLanguage(lang)` |
| `useChatStore` from `@elia-assistant/chatui/chat-store` | removed - no global chat store exists |
| `i18next.addResourceBundle(...)` on the global singleton | `instance.i18n?.addResourceBundle(...)` |
| `<App />` rendered directly | still supported, but must be wrapped in `<I18nextProvider>` + `<StoreProvider>` (see [Install](#raw-component-tree-no-shadow-root)) |

The `./store` and `./chat-store` subpath exports now expose only the `createSettingsStore` / `createChatStore` factories and their state types. Importing `useSettingsStore` from them fails at import time rather than silently returning something without `.getState()`.

---

## License

MIT - see [LICENSE](./LICENSE). Built by [Igor Demovic](https://github.com/idemovic).
