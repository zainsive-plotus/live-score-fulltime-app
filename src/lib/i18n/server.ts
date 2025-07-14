import { headers } from "next/headers";
import "server-only";
import { i18nCache } from "./i18n.cache";

type Translations = Record<string, any>;

/**
 * Gets the current locale from the request headers set by the middleware.
 * Must be awaited in a Server Component.
 * @returns A promise that resolves to the current locale string (e.g., 'en').
 */
export async function getLocale(): Promise<string> {
  const headersList = await headers();
  const locale = headersList.get("x-user-locale"); // Header from our simplified middleware

  // Validate the locale against our active languages from the cache
  const activeLocales = await i18nCache.getLocales();
  if (locale && activeLocales.includes(locale)) {
    return locale;
  }

  return await i18nCache.getDefaultLocale();
}

/**
 * A server-side hook to get the translation function 't'.
 * This must be used in Server Components.
 * @returns A promise that resolves to the translation function.
 */
export async function getI18n() {
  const locale = await getLocale();
  const translations = (await i18nCache.getTranslations(locale)) || {};

  /**
   * The translation function.
   * @param key - The key of the string to translate.
   * @param params - Optional parameters for interpolation.
   * @returns The translated string.
   */
  return function t(
    key: string,
    params?: { [key: string]: string | number }
  ): string {
    let translation = translations[key] || key;

    if (params) {
      Object.keys(params).forEach((paramKey) => {
        const regex = new RegExp(`{${paramKey}}`, "g");
        translation = translation.replace(regex, String(params[paramKey]));
      });
    }
    return translation;
  };
}
