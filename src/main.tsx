import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { App } from './App.tsx'
import { useSettingsStore } from './store/settingsStore.ts'

// Local dev entry: unlock the settings UI so we can configure at runtime.
// Consumers installing chatui as a package get the default (locked).
useSettingsStore.getState().setConfig({ hideSettings: false })

const rootEl = document.getElementById('root')
if (!rootEl) throw new Error('Root element not found')

createRoot(rootEl).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
