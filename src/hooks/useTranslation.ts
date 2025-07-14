"use client";

import { useI18n } from "@/lib/i18n/client";

/**
 * A custom hook that provides the translation function 't' and the current locale.
 * This hook is a wrapper around the client-side i18n context and should be
 * used in any client component that needs access to translations.
 */
export function useTranslation() {
  const { t, locale } = useI18n();
  return { t, locale };
}
