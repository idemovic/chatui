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

```ts
// src/main.tsx
import { App as ChatWidget } from '@elia-assistant/chatui'
import { useSettingsStore } from '@elia-assistant/chatui/store'
import '@elia-assistant/chatui/css'

useSettingsStore.getState().setConfig({
  webhookUrl: 'https://your-n8n.example.com/webhook/abc',
  mode: 'window',
})

// then render <ChatWidget /> inside a full-height container
```

The host's `vite.config.ts` needs `optimizeDeps.exclude: ['@elia-assistant/chatui']` so Vite doesn't re-bundle the already-bundled package. See [example.html](./example.html) for the full integration guide.

### Plain HTML (CDN, no bundler)

```html
<link rel="stylesheet"
      href="https://cdn.jsdelivr.net/npm/@elia-assistant/chatui/dist/chatui.iife.css">
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
import '@elia-assistant/chatui/css'

const instance = createChat({
  target: '#chat',
  webhookUrl: '...',
  mode: 'window',
})
// instance.unmount() to remove
```

---

## Features

- **n8n webhook compatible** — same parameters as `@n8n/chat`; works with any Chat Trigger out of the box
- **Three display modes** — `fullscreen`, `window` (floating button + popup), or `mixed` (window on desktop, fullscreen on mobile)
- **Bottom-sheet style** — opt-in `fullscreenSheet` mode covers ~3/4 of the screen with a rounded top instead of going edge-to-edge
- **Optional tabs** — surface a Notifications feed (URL or inline JSON) and a searchable FAQ alongside the chat
- **SSE streaming** — optional word-by-word bot responses
- **10 built-in themes** — Midnight, Ivory, Sunrise, Cosmos, Forest, Ocean, Cherry, Navy, Lavender, Amber; switch at runtime
- **12 built-in avatars** + file upload (max 500 KB) or URL — same picker for the floating button icon
- **CTA popup** — timed speech-bubble with optional Web Audio notification, window mode only
- **Conversation history** — optional sidebar with persistent multi-session history
- **Per-language content** — initial messages, bot name, CTA text, welcome subtitle, tab titles, all configurable per language
- **Multilingual UI** — English and Slovak bundled; extend via `i18next.addResourceBundle` at runtime
- **Markdown rendering** — bot messages render full GFM via `react-markdown`
- **Configurable "Powered by" footer** — change the link text/URL or hide it entirely
- **Persistent settings** — config + theme + language survive page reloads (`localStorage`)
- **Lockable UI** — `hideSettings: true` removes the gear, theme picker, and settings modal (default for npm consumers)
- **Export config** — generate ready-to-paste host code from the settings modal

---

## Configuration

All options live on `ChatConfig`. Set them once at boot via `setConfig()` (or pass to `createChat()`).

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
| `mode` | `'fullscreen' \| 'window' \| 'mixed'` | `'fullscreen'` | Display mode |
| `showSidebar` | `boolean` | `false` | Conversation history sidebar (fullscreen only) |
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

### "Powered by" footer

| Parameter | Type | Default | Description |
|---|---|---|---|
| `poweredByLabel` | `string` | `'ELIA AI Assistant'` | Link text |
| `poweredByUrl` | `string` | `'https://www.elia-asistent.com'` | Link URL |
| `poweredByHide` | `boolean` | `false` | Hide the entire footer line |

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

To set the initial UI language, call `useSettingsStore.getState().setLanguage('sk')` after `setConfig()` (or pass `language: 'sk'` to `createChat()`). On a fresh browser, the default falls back to `navigator.language` then `'en'`.

`LangOverride` fields: `initialMessages`, `ctaText`, `botName`, `welcomeSubtitle`, `tabs.{notifications,help,chat}.title`.

Resolution chain: `i18n[activeLang].X` -> `i18n['en'].X` -> global `config.X`.

---

## Themes

| ID | Name | Style | Accent |
|---|---|---|---|
| `midnight` | Midnight | Dark | Indigo `#6366f1` |
| `ivory` | Ivory | Light | Indigo `#4338ca` |
| `sunrise` | Sunrise | Light | Orange `#f97316` |
| `cosmos` | Cosmos | Dark | Purple `#a855f7` |
| `forest` | Forest | Dark | Green `#22c55e` |
| `ocean` | Ocean | Dark | Cyan `#06b6d4` |
| `cherry` | Cherry | Dark | Red `#ef4444` |
| `navy` | Navy | Dark | Blue `#3b82f6` |
| `lavender` | Lavender | Light | Violet `#8b5cf6` |
| `amber` | Amber | Dark | Amber `#f59e0b` |

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

```ts
import i18n from 'i18next'
import { useSettingsStore } from '@elia-assistant/chatui/store'

i18n.addResourceBundle('fr', 'translation', {
  welcome:  { subtitle: 'Commencez une conversation.' },
  input:    { placeholder: 'Tapez un message...' },
  // ...full keys: see node_modules/@elia-assistant/chatui/dist/chunks/translation-*.js
})

useSettingsStore.getState().setLanguage('fr')
```

Then any per-language overrides live under `config.i18n.fr`.

---

## Settings UI

Hidden by default for npm consumers — configuration is expected to live in code. Flip `hideSettings: false` to expose the gear, theme picker, and settings modal (handy for admin dashboards, internal tools, live demos):

```ts
useSettingsStore.getState().setConfig({
  webhookUrl:   '...',
  hideSettings: false,
})
```

The settings modal includes an **Export config** button that generates the exact `setConfig()` call for pasting into a host project.

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
- `dist/chatui.css` — pre-compiled stylesheet for ESM consumers
- `dist/chatui.iife.css` — same styles, paired naming for CDN consumers
- `dist/**/*.d.ts` — TypeScript declarations
- `dist/chunks/translation-*.js` — code-split locale bundles

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
| Styling (internal) | Tailwind CSS v4 — pre-compiled into `dist/chatui.css`; consumers don't need it |
| State | Zustand 5 with `persist` middleware |
| Markdown | `react-markdown` + `remark-gfm` |
| i18n | `react-i18next` + `i18next-resources-to-backend` (locales code-split, no HTTP fetch) |
| HTTP / SSE | Native `fetch` |

React 19 is a peer dependency for the ESM bundle. The IIFE bundle includes React + ReactDOM.

---

## License

MIT - see [LICENSE](./LICENSE). Built by [Igor Demovic](https://github.com/idemovic).
