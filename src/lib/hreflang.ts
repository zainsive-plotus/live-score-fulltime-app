// ===== src/lib/hreflang.ts =====

import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from "./i18n/config";

const BASE_URL =
  process.env.NEXT_PUBLIC_PUBLIC_APP_URL || "http://localhost:3000";

// --- NEW TYPE DEFINITION ---
// We define a type for the translation info our function can now accept.
export type TranslationInfo = {
  slug: string;
  language: string;
};

// The function is updated to accept an optional array of translations.
export async function generateHreflangTags(
  basePath: string, // e.g., "/news" or "/football/league"
  currentSlug: string, // The slug from the current URL, e.g., "my-first-post"
  currentLocale: string,
  translations?: TranslationInfo[]
) {
  const defaultLocale = DEFAULT_LOCALE;

  const alternates: {
    canonical: string;
    languages: { [key: string]: string };
  } = {
    canonical: "", // We will set this dynamically
    languages: {},
  };

  const getUrlForLocale = (locale: string, slug: string) => {
    // Construct the path without the locale first
    const path = `${basePath}/${slug}`;

    if (locale === defaultLocale) {
      return `${BASE_URL}${path}`;
    }
    return `${BASE_URL}/${locale}${path}`;
  };

  // If we have a list of translations, use it to build precise hreflang tags
  if (translations && translations.length > 0) {
    translations.forEach((translation) => {
      alternates.languages[translation.language] = getUrlForLocale(
        translation.language,
        translation.slug
      );
    });

    // Set the canonical URL to the one that matches the current page's locale
    const currentTranslation = translations.find(
      (t) => t.language === currentLocale
    );
    alternates.canonical = getUrlForLocale(
      currentLocale,
      currentTranslation ? currentTranslation.slug : currentSlug
    );
  } else {
    // Fallback for pages without translations (e.g., /contact-us)
    SUPPORTED_LOCALES.forEach((locale) => {
      // For non-translatable pages, the path is the same, just the locale prefix changes
      const path = `${basePath}${currentSlug}`.replace("//", "/");
      if (locale === defaultLocale) {
        alternates.languages[locale] = `${BASE_URL}${path}`;
      } else {
        alternates.languages[locale] = `${BASE_URL}/${locale}${path}`;
      }
    });
    const canonicalPath = `${basePath}${currentSlug}`.replace("//", "/");
    if (currentLocale === defaultLocale) {
      alternates.canonical = `${BASE_URL}${canonicalPath}`;
    } else {
      alternates.canonical = `${BASE_URL}/${currentLocale}${canonicalPath}`;
    }
  }

  // Always set the x-default to the default locale's URL
  if (translations && translations.length > 0) {
    const defaultTranslation = translations.find(
      (t) => t.language === defaultLocale
    );
    if (defaultTranslation) {
      alternates.languages["x-default"] = getUrlForLocale(
        defaultLocale,
        defaultTranslation.slug
      );
    } else {
      // Fallback if a default translation is missing for some reason
      alternates.languages["x-default"] = getUrlForLocale(
        defaultLocale,
        currentSlug
      );
    }
  } else {
    const path = `${basePath}${currentSlug}`.replace("//", "/");
    alternates.languages["x-default"] = `${BASE_URL}${path}`;
  }

  return alternates;
}
