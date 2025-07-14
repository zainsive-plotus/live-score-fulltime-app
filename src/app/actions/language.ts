"use server";

import { cookies } from "next/headers";

const I18N_COOKIE_NAME = "NEXT_LOCALE";

/**
 * A Server Action to set the locale cookie.
 * This is called by the LanguageDropdown on the client to securely
 * update the user's language preference.
 * @param locale - The new locale code to set (e.g., 'en', 'de').
 */
export async function setLocaleCookie(locale: string) {
  cookies().set(I18N_COOKIE_NAME, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365, // 1 year
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}
