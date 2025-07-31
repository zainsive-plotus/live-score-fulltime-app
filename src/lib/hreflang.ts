// ===== src/lib/hreflang.ts =====

// ***** FIX: Import constants from the single source of truth *****
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from "./i18n/config";

const BASE_URL =
  process.env.NEXT_PUBLIC_PUBLIC_APP_URL || "http://localhost:3000";

export async function generateHreflangTags(
  path: string,
  currentLocale: string,
  availableLocales?: string[]
) {
  const cleanPath = path === "/page" || path === "/" ? "" : path;

  // ***** FIX: Use the imported constant directly *****
  // This removes the database call and ensures consistency with the middleware.
  const defaultLocale = DEFAULT_LOCALE;

  const getUrlForLocale = (locale: string) => {
    if (locale === defaultLocale) {
      // For the default locale, the URL has no language prefix.
      // This is the CRUCIAL part that makes the hreflang tags point to the correct canonical URL.
      return `${BASE_URL}${cleanPath}`;
    }
    return `${BASE_URL}/${locale}${cleanPath}`;
  };

  const canonicalUrl = getUrlForLocale(currentLocale);

  const alternates: {
    canonical: string;
    languages: { [key: string]: string };
  } = {
    canonical: canonicalUrl,
    languages: {},
  };

  // Use the provided available locales for the page, or fall back to all supported locales.
  const localesToUse =
    availableLocales && availableLocales.length > 0
      ? availableLocales
      : SUPPORTED_LOCALES;

  localesToUse.forEach((locale) => {
    alternates.languages[locale] = getUrlForLocale(locale);
  });

  alternates.languages["x-default"] = getUrlForLocale(defaultLocale);

  return alternates;
}
