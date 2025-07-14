"use client";

import React, { createContext, useContext, ReactNode } from "react";
import "client-only";

type Translations = Record<string, any>;

interface I18nContextType {
  translations: Translations;
  locale: string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

interface I18nProviderClientProps {
  locale: string;
  translations: Translations;
  children: ReactNode;
}

/**
 * Provides the i18n context to all client components in the tree.
 * Must be used in the root layout to wrap the application.
 */
export function I18nProviderClient({
  locale,
  translations,
  children,
}: I18nProviderClientProps) {
  return (
    <I18nContext.Provider value={{ locale, translations }}>
      {children}
    </I18nContext.Provider>
  );
}

/**
 * A client-side hook to access the translation function 't' and the current locale.
 * This must be used within a component wrapped by `I18nProviderClient`.
 * @returns An object containing the translation function `t` and the current `locale`.
 */
export function useI18n() {
  const context = useContext(I18nContext);

  if (context === undefined) {
    throw new Error("useI18n must be used within an I18nProviderClient");
  }

  const { translations, locale } = context;

  /**
   * The translation function.
   * @param key - The key of the string to translate.
   * @param params - Optional parameters for interpolation.
   * @returns The translated string.
   */
  const t = (
    key: string,
    params?: { [key: string]: string | number }
  ): string => {
    let translation = translations[key] || key;

    if (params) {
      Object.keys(params).forEach((paramKey) => {
        const regex = new RegExp(`{${paramKey}}`, "g");
        translation = translation.replace(regex, String(params[paramKey]));
      });
    }
    return translation;
  };

  return { t, locale };
}
