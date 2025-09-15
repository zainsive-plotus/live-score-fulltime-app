// ===== src/lib/i18n/server.ts =====

import "server-only";
import { i18nCache } from "./i18n.cache";

export async function getI18n(localeFromParams?: string) {
  const supportedLocales = ["tr", "en", "fr", "es", "zu", "it"];

  const defaultLocale = "tr";

  const validatedLocale =
    localeFromParams && supportedLocales.includes(localeFromParams)
      ? localeFromParams
      : defaultLocale;

  const translations = (await i18nCache.getTranslations(validatedLocale)) || {};

  return function t(
    key: string,
    params?: { [key: string]: string | number }
  ): string {
    let translation: string = translations[key] || key;

    if (params) {
      Object.keys(params).forEach((paramKey) => {
        const regex = new RegExp(`{${paramKey}}`, "g");
        translation = translation.replace(regex, String(params[paramKey]));
      });
    }
    return translation;
  };
}
