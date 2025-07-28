// ===== src/lib/hreflang.ts =====

const SUPPORTED_LOCALES = ["tr", "en", "fr", "es", "zu"];
const DEFAULT_LOCALE = "tr";

const BASE_URL =
  process.env.NEXT_PUBLIC_PUBLIC_APP_URL || "http://localhost:3000";

// --- START OF MODIFICATION ---
// The function now accepts an optional 'availableLocales' array.
export function generateHreflangTags(
  path: string,
  currentLocale: string,
  availableLocales?: string[]
) {
  // --- END OF MODIFICATION ---

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

  // --- START OF MODIFICATION ---
  // Use the provided list of available locales, or fall back to all supported locales.
  const localesToUse =
    availableLocales && availableLocales.length > 0
      ? availableLocales
      : SUPPORTED_LOCALES;
  // --- END OF MODIFICATION ---

  localesToUse.forEach((locale) => {
    if (locale === DEFAULT_LOCALE) {
      alternates.languages[locale] = `${BASE_URL}${cleanPath}`;
    } else {
      alternates.languages[locale] = `${BASE_URL}/${locale}${cleanPath}`;
    }
  });

  // The x-default should always point to the default locale's version of the page.
  alternates.languages["x-default"] = `${BASE_URL}${cleanPath}`;

  return alternates;
}
