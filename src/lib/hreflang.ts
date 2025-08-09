// ===== src/lib/hreflang.ts =====

import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from "./i18n/config";

const BASE_URL =
  process.env.NEXT_PUBLIC_PUBLIC_APP_URL || "http://localhost:3000";

export type TranslationInfo = {
  slug: string;
  language: string;
};

// This is the new, more robust function
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
    // This logic now correctly joins paths, handling all edge cases.
    // It prevents missing slashes and double slashes.
    const pathSegments = [basePath, slug].filter(Boolean); // Filter out empty strings
    const path = pathSegments.join("/");
    const cleanPath = ("/" + path).replace(/\/+/g, "/"); // Ensure single leading slash and no double slashes

    if (locale === defaultLocale) {
      // For the default locale, we don't add the /tr prefix
      return `${BASE_URL}${cleanPath}`;
    }
    return `${BASE_URL}/${locale}${cleanPath}`;
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
