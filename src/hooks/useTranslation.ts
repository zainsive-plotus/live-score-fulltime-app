"use client";

import { useLanguage } from '@/context/LanguageContext';
import en from '@/locales/en.json';
import tr from '@/locales/tr.json';
import { type TranslationKey } from '@/types/translations';

// The `translations` object now needs a type hint so TypeScript
// understands its structure without relying on the `en.json` import for types.
const translations: Record<'en' | 'tr', Record<string, string>> = { en, tr };

export function useTranslation() {
  const { locale } = useLanguage();

  // The function signature now uses our reliable `TranslationKey` type.
  const t = (key: TranslationKey, params?: { [key: string]: string | number }): string => {
    // We look up the translation using the key.
    // The `|| key` ensures it falls back gracefully if a key is somehow missing from a language file.
    let translation = translations[locale][key] || key;

    if (params) {
      Object.keys(params).forEach(paramKey => {
        const regex = new RegExp(`{${paramKey}}`, 'g');
        translation = translation.replace(regex, String(params[paramKey]));
      });
    }

    return translation;
  };

  return { t, locale };
}