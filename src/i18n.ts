import i18next, { type i18n as I18nInstance } from 'i18next'
import { initReactI18next } from 'react-i18next'
import resourcesToBackend from 'i18next-resources-to-backend'
import { scopedKey } from './lib/storage.ts'

type LocaleModule = { default: Record<string, unknown> }

const localeModules = import.meta.glob<LocaleModule>('./locales/*/translation.json')

const supportedLngs = Array.from(
  new Set(
    Object.keys(localeModules)
      .map((path) => path.split('/')[2])
      .filter((lng): lng is string => Boolean(lng)),
  ),
)

function getInitialLang(namespace?: string): string {
  try {
    const raw = localStorage.getItem(scopedKey('chatui-settings', namespace))
    if (raw) {
      const parsed = JSON.parse(raw) as { state?: { language?: string } }
      const lang = parsed.state?.language
      if (lang) return lang
    }
  } catch {
    // ignore
  }
  return 'en'
}

/**
 * Creates one createChat() instance's i18next instance (UI chrome strings: input placeholder,
 * "Powered by", etc. - not the host-supplied bot content in config.i18n). Each instance gets
 * its own so simultaneous instances on the same page don't force each other's UI language when
 * one switches (see StoreContext.tsx for the equivalent settings/chat store isolation).
 */
export function createChatI18n(namespace?: string): I18nInstance {
  const instance = i18next.createInstance()
  void instance
    // NOTE: initReactI18next also overwrites react-i18next's *global* default instance on every
    // init, so the last instance created wins that slot. Everything the widget renders sits
    // inside <I18nextProvider>, which takes precedence over the global default, so this is
    // harmless today. Anything rendered outside that provider (a portal, a lazily-imported
    // component) would silently pick up another instance's language - keep the tree wrapped.
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
      lng: getInitialLang(namespace),
      fallbackLng: 'en',
      supportedLngs,
      interpolation: {
        escapeValue: false,
      },
    })
  return instance
}
