import { headers } from "next/headers";
import "server-only";
import { i18nCache } from "./i18n.cache";

type Translations = Record<string, any>;

/**
 * Gets the current locale by reading the 'x-user-locale' header set by the middleware.
 * This function must be awaited in an async Server Component.
 * @returns {Promise<string>} The determined locale code (e.g., 'en', 'tr').
 */
export async function getLocale(): Promise<string> {
  const headersList = await headers();
  const localeFromHeader = headersList.get("x-user-locale");

  await i18nCache.initialize(); // Ensure cache is ready
  const activeLocales = await i18nCache.getLocales();

  if (localeFromHeader && activeLocales.includes(localeFromHeader)) {
    return localeFromHeader;
  }

  return await i18nCache.getDefaultLocale();
}

/**
 * A server-side helper to get the translation function 't'.
 * This must be awaited in Server Components.
 * @returns {Promise<Function>} A promise that resolves to the translation function.
 */
export async function getI18n() {
  const locale = await getLocale();
  const translations = (await i18nCache.getTranslations(locale)) || {};

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
