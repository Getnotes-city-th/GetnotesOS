import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { translations, type Language, type TranslationDictionary } from './translations'

const LANGUAGE_STORAGE_KEY = 'getnotesos_language'

interface I18nContextValue {
  language: Language
  setLanguage: (lang: Language) => void
  toggleLanguage: () => void
  t: (key: keyof TranslationDictionary, fallback?: string) => string
  dict: TranslationDictionary
}

const I18nContext = createContext<I18nContextValue | null>(null)

function getInitialLanguage(): Language {
  const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY)
  if (stored === 'th' || stored === 'en') return stored
  // Default to Thai
  return 'th'
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(getInitialLanguage)

  useEffect(() => {
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, language)
      document.documentElement.lang = language
    } catch {
      // localStorage may be unavailable
    }
  }, [language])

  const value = useMemo<I18nContextValue>(() => {
    const dict = translations[language] || translations.th
    return {
      language,
      setLanguage: (lang: Language) => {
        setLanguageState(lang)
      },
      toggleLanguage: () => {
        setLanguageState((prev) => (prev === 'th' ? 'en' : 'th'))
      },
      t: (key: keyof TranslationDictionary, fallback?: string) => {
        return dict[key] ?? fallback ?? (translations.en[key] || String(key))
      },
      dict,
    }
  }, [language])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const context = useContext(I18nContext)
  if (!context) {
    // Fallback if rendered outside provider
    const dict = translations.th
    return {
      language: 'th' as Language,
      setLanguage: () => {},
      toggleLanguage: () => {},
      t: (key: keyof TranslationDictionary, fallback?: string) => dict[key] ?? fallback ?? String(key),
      dict,
    }
  }
  return context
}
