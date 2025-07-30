// ===== src/lib/hreflang.ts =====

import { i18nCache } from "./i18n/i18n.cache";

const BASE_URL =
  process.env.NEXT_PUBLIC_PUBLIC_APP_URL || "http://localhost:3000";

export async function generateHreflangTags(
  path: string,
  currentLocale: string,
  availableLocales?: string[]
) {
  const cleanPath = path === "/page" || path === "/" ? "" : path;

  // --- Start of Fix ---
  // Re-introduce the special handling for the default locale.
  const defaultLocale = await i18nCache.getDefaultLocale();

  const getUrlForLocale = (locale: string) => {
    if (locale === defaultLocale) {
      // Default locale gets the clean, non-prefixed URL.
      return `${BASE_URL}${cleanPath}`;
    }
    // All other locales get a prefixed URL.
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

  const supportedLocales = await i18nCache.getLocales();
  const localesToUse =
    availableLocales && availableLocales.length > 0
      ? availableLocales
      : supportedLocales;

  localesToUse.forEach((locale) => {
    alternates.languages[locale] = getUrlForLocale(locale);
  });

  // The x-default should point to the non-prefixed, default language version.
  alternates.languages["x-default"] = getUrlForLocale(defaultLocale);
  // --- End of Fix ---

  return alternates;
}