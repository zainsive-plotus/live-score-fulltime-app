// ===== src/lib/hreflang.ts =====

import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from "./i18n/config";

const BASE_URL =
  process.env.NEXT_PUBLIC_PUBLIC_APP_URL || "http://localhost:3000";

export type TranslationInfo = {
  slug: string;
  language: string;
};

export async function generateHreflangTags(
  basePath: string,
  currentSlug: string,
  currentLocale: string,
  translations?: TranslationInfo[]
) {
  const defaultLocale = DEFAULT_LOCALE;
  const alternates: {
    canonical: string;
    languages: { [key: string]: string };
  } = {
    canonical: "",
    languages: {},
  };

  const getUrlForLocale = (locale: string, slug: string) => {
    // --- THIS IS THE FIX ---
    // This logic now correctly handles all path joining without adding
    // unnecessary trailing slashes.
    const pathSegments = [basePath, slug].filter(Boolean);
    let path = pathSegments.join("/");

    // Ensure it starts with a slash, but handle the root case ("/") gracefully.
    if (path === "/") {
      // This is the homepage
      if (locale === defaultLocale) return `${BASE_URL}/`;
      return `${BASE_URL}/${locale}`; // No trailing slash for locale-only paths
    }

    // For all other paths, ensure a single leading slash and no trailing slash.
    const cleanPath = ("/" + path).replace(/\/+/g, "/").replace(/\/$/, "");

    if (locale === defaultLocale) {
      return `${BASE_URL}${cleanPath}`;
    }
    return `${BASE_URL}/${locale}${cleanPath}`;
    // --- END OF FIX ---
  };

  if (translations && translations.length > 0) {
    translations.forEach((translation) => {
      alternates.languages[translation.language] = getUrlForLocale(
        translation.language,
        translation.slug
      );
    });
    const currentTranslation = translations.find(
      (t) => t.language === currentLocale
    );
    alternates.canonical = getUrlForLocale(
      currentLocale,
      currentTranslation ? currentTranslation.slug : currentSlug
    );
  } else {
    // Fallback for pages without explicit translations
    SUPPORTED_LOCALES.forEach((locale) => {
      alternates.languages[locale] = getUrlForLocale(locale, currentSlug);
    });
    alternates.canonical = getUrlForLocale(currentLocale, currentSlug);
  }

  // Set the x-default tag
  const defaultTranslation = translations?.find(
    (t) => t.language === defaultLocale
  );
  alternates.languages["x-default"] = getUrlForLocale(
    defaultLocale,
    defaultTranslation ? defaultTranslation.slug : currentSlug
  );

  return alternates;
}
