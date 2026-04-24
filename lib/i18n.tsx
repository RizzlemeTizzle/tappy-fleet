'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { T1 } from './i18n-t1';
import { T2 } from './i18n-t2';
import { T3 } from './i18n-t3';

export const TAPPY_LANGS = [
  { code: 'en', name: 'English',     flag: '🇬🇧' },
  { code: 'de', name: 'Deutsch',     flag: '🇩🇪' },
  { code: 'fr', name: 'Français',    flag: '🇫🇷' },
  { code: 'es', name: 'Español',     flag: '🇪🇸' },
  { code: 'it', name: 'Italiano',    flag: '🇮🇹' },
  { code: 'pt', name: 'Português',   flag: '🇵🇹' },
  { code: 'nl', name: 'Nederlands',  flag: '🇳🇱' },
  { code: 'pl', name: 'Polski',      flag: '🇵🇱' },
  { code: 'sv', name: 'Svenska',     flag: '🇸🇪' },
  { code: 'da', name: 'Dansk',       flag: '🇩🇰' },
  { code: 'no', name: 'Norsk',       flag: '🇳🇴' },
  { code: 'fi', name: 'Suomi',       flag: '🇫🇮' },
  { code: 'cs', name: 'Čeština',     flag: '🇨🇿' },
  { code: 'sk', name: 'Slovenčina',  flag: '🇸🇰' },
  { code: 'hu', name: 'Magyar',      flag: '🇭🇺' },
  { code: 'ro', name: 'Română',      flag: '🇷🇴' },
  { code: 'bg', name: 'Български',   flag: '🇧🇬' },
  { code: 'hr', name: 'Hrvatski',    flag: '🇭🇷' },
  { code: 'sl', name: 'Slovenščina', flag: '🇸🇮' },
  { code: 'et', name: 'Eesti',       flag: '🇪🇪' },
  { code: 'lv', name: 'Latviešu',    flag: '🇱🇻' },
  { code: 'lt', name: 'Lietuvių',    flag: '🇱🇹' },
  { code: 'el', name: 'Ελληνικά',    flag: '🇬🇷' },
  { code: 'tr', name: 'Türkçe',      flag: '🇹🇷' },
  { code: 'uk', name: 'Українська',  flag: '🇺🇦' },
  { code: 'ca', name: 'Català',      flag: '🏴󠁥󠁳󠁣󠁴󠁿' },
] as const;

const TRANSLATIONS: Record<string, Record<string, string>> = { ...T1, ...T2, ...T3 };

interface I18nCtx {
  lang: string;
  setLang: (code: string) => void;
}

const Ctx = createContext<I18nCtx>({ lang: 'en', setLang: () => {} });

function detectLang(): string {
  if (typeof window === 'undefined') return 'en';
  const saved = localStorage.getItem('tappy_lang');
  if (saved && TAPPY_LANGS.find((l) => l.code === saved)) return saved;
  const browser = (navigator.language || '').split('-')[0].toLowerCase();
  return TAPPY_LANGS.find((l) => l.code === browser) ? browser : 'en';
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<string>('en');

  useEffect(() => {
    setLangState(detectLang());
  }, []);

  const setLang = useCallback((code: string) => {
    if (!TAPPY_LANGS.find((l) => l.code === code)) return;
    localStorage.setItem('tappy_lang', code);
    document.documentElement.lang = code;
    setLangState(code);
  }, []);

  return <Ctx.Provider value={{ lang, setLang }}>{children}</Ctx.Provider>;
}

export function useLang() {
  return useContext(Ctx);
}

export function useT() {
  const { lang } = useContext(Ctx);
  return useCallback(
    (key: string): string => {
      const dict = TRANSLATIONS[lang] ?? TRANSLATIONS.en ?? {};
      return (dict[key] ?? TRANSLATIONS.en?.[key] ?? key);
    },
    [lang],
  );
}
