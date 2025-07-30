// ===== src/middleware.ts =====

import { NextRequest, NextResponse } from "next/server";
import Negotiator from "negotiator";
// DO NOT import from i18nCache here, as it connects to the database.

const I18N_COOKIE_NAME = "NEXT_LOCALE";
// --- Start of Fix ---
// This list MUST be kept in sync with the active languages in your database.
// This is a necessary trade-off to keep the middleware database-free and Edge-compatible.
const SUPPORTED_LOCALES = ["tr", "en", "fr", "es", "zu", "it"];
const DEFAULT_LOCALE = "tr";
// --- End of Fix ---

function getLocale(request: NextRequest): string {
  const cookieLocale = request.cookies.get(I18N_COOKIE_NAME)?.value;
  if (cookieLocale && SUPPORTED_LOCALES.includes(cookieLocale)) {
    return cookieLocale;
  }

  const languages = new Negotiator({
    headers: {
      "accept-language": request.headers.get("accept-language") || "",
    },
  }).languages();

  for (const lang of languages) {
    if (SUPPORTED_LOCALES.includes(lang)) return lang;
    const baseLang = lang.split("-")[0];
    if (SUPPORTED_LOCALES.includes(baseLang)) return baseLang;
  }

  return DEFAULT_LOCALE;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for API, admin, static files, etc.
  if (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.includes(".") // Exclude files with extensions
  ) {
    return NextResponse.next();
  }

  const pathnameHasLocale = SUPPORTED_LOCALES.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (pathnameHasLocale) {
    // If a user tries to access the default locale with a prefix (e.g., /tr/news),
    // redirect them to the clean, non-prefixed URL to avoid duplicate content.
    if (pathname.startsWith(`/${DEFAULT_LOCALE}`)) {
        const newPath = pathname.replace(`/${DEFAULT_LOCALE}`, "");
        const url = new URL(newPath === "" ? "/" : newPath, request.url);
        return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // Logic to handle requests without a locale prefix.
  const detectedLocale = getLocale(request);
  let response: NextResponse;

  if (detectedLocale === DEFAULT_LOCALE) {
    // For the default locale, REWRITE the URL to include the locale for Next.js's router,
    // but keep the URL in the browser's address bar clean.
    response = NextResponse.rewrite(
      new URL(`/${DEFAULT_LOCALE}${pathname}`, request.url)
    );
  } else {
    // For all other locales, REDIRECT the user to the URL with the correct prefix.
    response = NextResponse.redirect(
      new URL(`/${detectedLocale}${pathname}`, request.url)
    );
  }

  response.cookies.set(I18N_COOKIE_NAME, detectedLocale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  return response;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|assets|favicon.ico|sw.js|.*\\..*).*)'
  ],
};