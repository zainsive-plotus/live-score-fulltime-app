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
    // This new logic correctly handles root paths and prevents trailing slashes.
    let path = basePath;
    if (slug) {
      // Ensure there's a single slash between base path and slug
      path = `${basePath.replace(/\/$/, "")}/${slug}`;
    }

    // For the absolute root, path will be just "/", handle it gracefully
    if (path === "/") {
      if (locale === defaultLocale) {
        return `${BASE_URL}/`;
      }
      return `${BASE_URL}/${locale}/`;
    }

    const cleanPath = path.replace(/\/+/g, "/");

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
    SUPPORTED_LOCALES.forEach((locale) => {
      alternates.languages[locale] = getUrlForLocale(locale, currentSlug);
    });
    alternates.canonical = getUrlForLocale(currentLocale, currentSlug);
  }

  const defaultTranslation = translations?.find(
    (t) => t.language === defaultLocale
  );
  alternates.languages["x-default"] = getUrlForLocale(
    defaultLocale,
    defaultTranslation ? defaultTranslation.slug : currentSlug
  );

  return alternates;
}
