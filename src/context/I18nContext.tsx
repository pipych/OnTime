import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { TRANSLATIONS, type Language, type Translations } from '../constants/i18n';

interface I18nContextValue {
  lang: Language;
  setLang: (lang: Language) => void;
  t: Translations;
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

const LANG_STORAGE_KEY = 'vchasno_user_lang';

export const I18nProvider: React.FC<{
  initialLang?: Language;
  children: React.ReactNode;
}> = ({ initialLang, children }) => {
  const [lang, setLangState] = useState<Language>(() => {
    if (initialLang) return initialLang;
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(LANG_STORAGE_KEY) as Language | null;
      if (stored === 'ru' || stored === 'uk') return stored;
    }
    return 'ru';
  });

  // When initialLang changes (e.g. after fetching user settings from bot)
  useEffect(() => {
    if (initialLang && (initialLang === 'ru' || initialLang === 'uk')) {
      setLangState(initialLang);
      try {
        localStorage.setItem(LANG_STORAGE_KEY, initialLang);
      } catch (_) {}
    }
  }, [initialLang]);

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(LANG_STORAGE_KEY, newLang);
      } catch (_) {}
    }
  };

  const t = useMemo(() => TRANSLATIONS[lang] || TRANSLATIONS.ru, [lang]);

  const value = useMemo(
    () => ({
      lang,
      setLang,
      t,
    }),
    [lang, t]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext);
  if (!context) {
    return {
      lang: 'ru',
      setLang: () => {},
      t: TRANSLATIONS.ru,
    };
  }
  return context;
}
