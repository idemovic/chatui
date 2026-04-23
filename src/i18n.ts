import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import resourcesToBackend from 'i18next-resources-to-backend'

type LocaleModule = { default: Record<string, unknown> }

const localeModules = import.meta.glob<LocaleModule>('./locales/*/translation.json')

const supportedLngs = Array.from(
  new Set(
    Object.keys(localeModules)
      .map((path) => path.split('/')[2])
      .filter((lng): lng is string => Boolean(lng)),
  ),
)

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
  return navigator.language.split('-')[0] ?? 'en'
}

void i18n
  .use(
    resourcesToBackend(async (lng: string, ns: string) => {
      const loader = localeModules[`./locales/${lng}/${ns}.json`]
      if (!loader) throw new Error(`Missing locale bundle: ${lng}/${ns}`)
      const mod = await loader()
      return mod.default
    }),
  )
  .use(initReactI18next)
  .init({
    lng: getInitialLang(),
    fallbackLng: 'en',
    supportedLngs,
    interpolation: {
      escapeValue: false,
    },
  })

export default i18n
