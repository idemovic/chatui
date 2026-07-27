import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { I18nextProvider } from 'react-i18next'
import './index.css'
import { App } from './App.tsx'
import { createSettingsStore } from './store/settingsStore.ts'
import { createChatStore } from './store/chatStore.ts'
import { StoreProvider } from './store/StoreContext.tsx'
import { createChatI18n } from './i18n.ts'

const i18nInstance = createChatI18n()
const settingsStore = createSettingsStore(i18nInstance)
const chatStore = createChatStore()

// Local dev entry: unlock the settings UI so we can configure at runtime.
// Consumers installing chatui as a package get the default (locked).
settingsStore.getState().setConfig({ hideSettings: false })

const rootEl = document.getElementById('root')
if (!rootEl) throw new Error('Root element not found')

createRoot(rootEl).render(
  <StrictMode>
    <I18nextProvider i18n={i18nInstance}>
      <StoreProvider settingsStore={settingsStore} chatStore={chatStore}>
        <App />
      </StoreProvider>
    </I18nextProvider>
  </StrictMode>,
)
