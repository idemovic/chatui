import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import HttpBackend from 'i18next-http-backend'

/** Read the persisted language from Zustand's localStorage entry before React boots. */
function getInitialLang(): string {
  try {
    const raw = localStorage.getItem('chatui-settings')
    if (raw) {
      const parsed = JSON.parse(raw) as { state?: { language?: string } }
      const lang = parsed.state?.language
      if (lang) return lang
    }
  } catch {
    // ignore
  }
  // Fall back to browser language (first segment only: "en-US" → "en")
  return navigator.language.split('-')[0] ?? 'en'
}

void i18n
  .use(HttpBackend)
  .use(initReactI18next)
  .init({
    lng: getInitialLang(),
    fallbackLng: 'en',
    supportedLngs: ['en', 'sk'],
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },
    interpolation: {
      escapeValue: false,
    },
  })

export default i18n
