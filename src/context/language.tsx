import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';

type Translations = Record<string, string>;

type I18nContextValue = {
  locale: string;
  setLocale: (locale: string) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

const translations: Record<string, Translations> = {};

export function registerTranslations(locale: string, data: Translations) {
  translations[locale] = data;
}

function interpolate(template: string, params?: Record<string, string | number>): string {
  if (!params) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => String(params[key] ?? `{{${key}}}`));
}

export function I18nProvider({ children, defaultLocale = 'en' }: { children: ReactNode; defaultLocale?: string }) {
  const [locale, setLocale] = useState(() => {
    try {
      return localStorage.getItem('opencode-locale') ?? defaultLocale;
    } catch {
      return defaultLocale;
    }
  });

  const handleSetLocale = useCallback((newLocale: string) => {
    setLocale(newLocale);
    try {
      localStorage.setItem('opencode-locale', newLocale);
    } catch {
      // ignore
    }
  }, []);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>) => {
      const trans = translations[locale] ?? translations['en'] ?? {};
      const template = trans[key] ?? key;
      return interpolate(template, params);
    },
    [locale],
  );

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return (
    <I18nContext.Provider value={{ locale, setLocale: handleSetLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}
