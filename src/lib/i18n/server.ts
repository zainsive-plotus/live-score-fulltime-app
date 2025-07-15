import "server-only";
import path from "path";
import { promises as fs } from "fs";

// This list must be kept in sync with the list in middleware.ts
const SUPPORTED_LOCALES = ["tr", "en", "de", "fr", "es", "ar", "zu"];
const DEFAULT_LOCALE = "tr";
const LOCALES_DIR = path.join(process.cwd(), "src/locales");

// A lightweight, in-memory cache for the translation files themselves.
const translationsCache = new Map<string, Record<string, any>>();

async function getTranslationsFromFile(
  locale: string
): Promise<Record<string, any>> {
  // Check memory cache first
  if (translationsCache.has(locale)) {
    return translationsCache.get(locale)!;
  }

  const filePath = path.join(LOCALES_DIR, `${locale}.json`);

  try {
    const fileContent = await fs.readFile(filePath, "utf-8");
    const translations = JSON.parse(fileContent);
    translationsCache.set(locale, translations); // Cache the result
    return translations;
  } catch (error) {
    console.error(`Could not load translations for locale: ${locale}`, error);
    // Return an empty object on error to prevent crashes
    return {};
  }
}

/**
 * Gets the translation function `t` for a given locale on the server.
 * This is now fully Edge-compatible as it only reads from the filesystem.
 * @param {string} localeFromParams - The locale string from the page's params.
 * @returns {Promise<Function>} A function `t(key, params)` for translations.
 */
export async function getI18n(localeFromParams: string) {
  const validatedLocale = SUPPORTED_LOCALES.includes(localeFromParams)
    ? localeFromParams
    : DEFAULT_LOCALE;

  const translations = await getTranslationsFromFile(validatedLocale);

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
