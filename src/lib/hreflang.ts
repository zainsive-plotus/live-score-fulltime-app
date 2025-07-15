// IMPORTANT: This list must be kept in sync with middleware.ts.
const SUPPORTED_LOCALES = ["tr", "en", "de", "fr", "es", "ar", "zu"];
const DEFAULT_LOCALE = "tr";

const BASE_URL =
  process.env.NEXT_PUBLIC_PUBLIC_APP_URL || "http://localhost:3000";

/**
 * Generates the hreflang alternate links for a given page path.
 * This version handles the default locale at the root path.
 * @param {string} path - The canonical path of the page, WITHOUT locale prefix (e.g., '/football/news/some-slug').
 * @param {string} currentLocale - The locale of the current page being rendered.
 * @returns {{ languages: Record<string, string>, canonical: string }} - The alternates object for Next.js metadata.
 */
export function generateHreflangTags(path: string, currentLocale: string) {
  // If the path is for the homepage, ensure it's just '/'
  const cleanPath = path === "/page" || path === "/" ? "" : path;

  const alternates: {
    canonical: string;
    languages: { [key: string]: string };
  } = {
    canonical:
      currentLocale === DEFAULT_LOCALE
        ? `${BASE_URL}${cleanPath}`
        : `${BASE_URL}/${currentLocale}${cleanPath}`,
    languages: {},
  };

  SUPPORTED_LOCALES.forEach((locale) => {
    if (locale === DEFAULT_LOCALE) {
      // The default locale should point to the root URL
      alternates.languages[locale] = `${BASE_URL}${cleanPath}`;
    } else {
      alternates.languages[locale] = `${BASE_URL}/${locale}${cleanPath}`;
    }
  });

  // The x-default should always point to the root URL for the default language
  alternates.languages["x-default"] = `${BASE_URL}${cleanPath}`;

  return alternates;
}
