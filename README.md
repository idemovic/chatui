# Chat UI

A polished chat UI built for [Elia Assistant](https://elia-asistent.com), compatible with n8n.  
Drop it in front of any n8n AI Agent workflow, no backend code needed.


Built with **React 19 + Vite + Tailwind CSS v4**. Config-compatible with the official [@n8n/chat](https://www.npmjs.com/package/@n8n/chat) package.

---

## Features

- **n8n webhook compatible** — same parameters as `@n8n/chat`; works with any n8n Chat Trigger node out of the box
- **SSE streaming** — optional word-by-word bot responses via Server-Sent Events
- **10 built-in themes** — Midnight, Ivory, Sunrise (orange/white), Cosmos, Forest, Ocean, Cherry, Navy, Lavender, Amber; switch at runtime
- **Two display modes** — `fullscreen` (standalone page) or `window` (floating button + popup panel)
- **CTA popup** — timed speech-bubble with a Web Audio notification sound, shown once above the toggle button in window mode
- **Conversation history** — optional sidebar with persistent multi-session history (Zustand + localStorage)
- **Per-language content** — initial messages, bot name, CTA text and welcome subtitle configurable per language code
- **Multilingual UI** — English and Slovak included; extend by adding locale JSON files
- **Markdown rendering** — bot messages support full GFM markdown via `react-markdown`
- **Typing indicator** — animated three-dot indicator while awaiting a response
- **Persistent settings** — theme, language, and all config survive page reload
- **Public mode** — build once with the settings UI locked; config loaded from a JSON file at runtime (no rebuild needed to change webhook URL)

---

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173), click the **Settings** gear, paste your n8n webhook URL and hit **Save**.

---

## Configuration

All settings live in the **Settings modal** inside the app (gear icon in the header or sidebar).  
They are persisted automatically to `localStorage`.

### ChatConfig reference

| Parameter | Type | Default | Description |
|---|---|---|---|
| `webhookUrl` | `string` | — | **Required.** n8n Chat Trigger webhook URL |
| `webhookConfig.method` | `'POST' \| 'GET'` | `'POST'` | HTTP method |
| `webhookConfig.headers` | `Record<string,string>` | — | Extra request headers (e.g. auth) |
| `chatInputKey` | `string` | `'chatInput'` | Body key for the user message |
| `chatSessionKey` | `string` | `'sessionId'` | Body key for the session ID |
| `metadata` | `object` | — | Extra fields merged into every request body |
| `mode` | `'fullscreen' \| 'window' \| 'mixed'` | `'fullscreen'` | Display mode (`mixed` = fullscreen on mobile, window on desktop) |
| `showWelcomeScreen` | `boolean` | `true` | Show welcome screen when no messages |
| `showSidebar` | `boolean` | `false` | Show conversation history sidebar (fullscreen mode) |
| `streaming` | `boolean` | `false` | Enable SSE streaming mode |
| `botName` | `string` | `'Assistant'` | Global bot display name (overridable per language) |
| `initialMessages` | `string[]` | `[]` | Global fallback initial bot messages |
| `allowFileUploads` | `boolean` | `false` | Show file attachment button |
| `theme` | `string` | `'midnight'` | Initial theme ID |
| `defaultLanguage` | `string` | `'en'` | Initial UI language |
| `i18n` | `Record<string, LangOverride>` | — | Per-language content overrides (see below) |

#### Window mode (CTA popup)

| Parameter | Type | Default | Description |
|---|---|---|---|
| `showCta` | `boolean` | `true` | Show CTA speech-bubble after delay |
| `ctaText` | `string` | `'Hi! How can I help you today?'` | Global fallback CTA text |
| `ctaDelay` | `number` | `5000` | Milliseconds before CTA appears |
| `ctaSound` | `boolean` | `true` | Play a Web Audio notification sound with CTA |

#### Per-language content (`i18n`)

Keyed by language code. Values override the global fallback for that language.

```ts
i18n: {
  en: {
    initialMessages: ['Hi! How can I help you today?', 'I speak your language.'],
    botName: 'Sam',
    welcomeSubtitle: 'Ask me anything.',
    ctaText: 'Try me now!',
  },
  sk: {
    initialMessages: ['Dobrý deň! Ako vám môžem pomôcť?'],
    botName: 'Sam',
    welcomeSubtitle: 'Opýtajte sa ma čokoľvek.',
    ctaText: 'Vyskúšajte ma!',
  },
}
```

Resolution order: `i18n[activeLang]` → `i18n['en']` → global `config.*`

---

## Themes

| ID | Name | Style | Accent |
|---|---|---|---|
| `midnight` | Midnight | Dark | Indigo `#6366f1` |
| `ivory` | Ivory | Light | Indigo `#4338ca` |
| `sunrise` | Sunrise | Light | **Orange `#f97316`** |
| `cosmos` | Cosmos | Dark | Purple `#a855f7` |
| `forest` | Forest | Dark | Green `#22c55e` |
| `ocean` | Ocean | Dark | Cyan `#06b6d4` |
| `cherry` | Cherry | Dark | Red `#ef4444` |
| `navy` | Navy | Dark | Blue `#3b82f6` |
| `lavender` | Lavender | Light | Violet `#8b5cf6` |
| `amber` | Amber | Dark | Amber `#f59e0b` |

Themes are defined in `src/themes.ts` as plain objects — add your own by appending to the array.

---

## n8n Setup

1. Add a **Chat Trigger** node to your workflow.
2. Copy the **Production URL** from the node.
3. Paste it into the chatui **Settings → Webhook URL** field.
4. Make sure the workflow is **Active**.

The request body sent by chatui:

```json
{
  "chatInput": "user message text",
  "sessionId": "abc123",
  ...metadata
}
```

The expected response:

```json
{ "output": "bot reply text" }
```

For streaming, enable **Streaming** in settings and configure your n8n workflow to return SSE (`text/event-stream`). Each event:

```
data: {"text": "chunk"}
```

---

## Adding a language

1. Create `public/locales/<code>/translation.json` (copy `en/translation.json` and translate).
2. Add `<code>` to `supportedLngs` in `src/i18n.ts`.
3. In the app **Settings → Per-language content**, click **+ Add language** and select the new code.

---

## Public mode (production deployment)

Public mode locks the settings UI and loads all configuration from a JSON file at runtime. The build is done once; the config can be updated on the server without rebuilding.

### 1. Create your `.env` file

```bash
cp .env.example .env
```

Edit `.env`:

```env
VITE_PUBLIC_MODE=true
VITE_CONFIG_URL=/chat-config.json   # optional, this is the default
```

### 2. Create your config file

```bash
cp public/chat-config.example.json public/chat-config.json
```

Edit `public/chat-config.json` — fill in your webhook URL, bot name, initial messages per language, etc.  
`chat-config.json` is in `.gitignore` so secrets are never committed.

### 3. Build

```bash
npm run build
```

Deploy the contents of `dist/` together with your `chat-config.json`.  
The browser fetches `chat-config.json` on every page load — update it on the server to change any setting without a rebuild.

### What changes in public mode

| Feature | Dev mode | Public mode |
|---|---|---|
| Settings gear icon | Visible | Hidden |
| Settings modal | Accessible | Not rendered |
| Webhook URL | Editable in UI | From `chat-config.json` |
| Theme picker | Visible | Hidden |
| Language switcher | In settings | In settings (hidden) |
| Config source | `localStorage` | `chat-config.json` (fetched) |

> **Note:** `VITE_PUBLIC_MODE` is baked into the bundle at build time by Vite. Changing the value requires a rebuild. The config **contents** (`chat-config.json`) are fetched at runtime and can be updated freely.

---

## Tech stack

| Concern | Library |
|---|---|
| Build | Vite 8 + `@vitejs/plugin-react` |
| Styling | Tailwind CSS v4 (`@tailwindcss/vite`) |
| State | Zustand 5 with `persist` middleware |
| Markdown | `react-markdown` + `remark-gfm` |
| i18n | `react-i18next` + `i18next-http-backend` |
| HTTP / SSE | Native `fetch` |

---

## Scripts

```bash
npm run dev      # Development server (http://localhost:5173)
npm run build    # TypeScript check + production build → dist/
npm run preview  # Preview production build locally
```

---

## License

MIT
