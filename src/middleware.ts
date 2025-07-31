// ===== src/middleware.ts =====

import { NextRequest, NextResponse } from "next/server";
// Negotiator is no longer needed for the new, simpler logic.

const I18N_COOKIE_NAME = "NEXT_LOCALE";
const SUPPORTED_LOCALES = ["tr", "en", "fr", "es", "zu", "it"];
const DEFAULT_LOCALE = "tr";

// --- Start of Simplified getLocale Function ---
function getLocale(request: NextRequest): string {
  // 1. Check for a previously set language cookie
  const cookieLocale = request.cookies.get(I18N_COOKIE_NAME)?.value;
  if (cookieLocale && SUPPORTED_LOCALES.includes(cookieLocale)) {
    return cookieLocale;
  }

  // 2. If no valid cookie, always return the site's default locale.
  // We no longer check the browser's Accept-Language header for the initial redirect.
  return DEFAULT_LOCALE;
}
// --- End of Simplified getLocale Function ---

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const pathnameHasLocale = SUPPORTED_LOCALES.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (pathnameHasLocale) {
    if (pathname.startsWith(`/${DEFAULT_LOCALE}`)) {
      const newPath = pathname.replace(`/${DEFAULT_LOCALE}`, "");
      const url = new URL(newPath === "" ? "/" : newPath, request.url);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  const detectedLocale = getLocale(request);
  let response: NextResponse;

  if (detectedLocale === DEFAULT_LOCALE) {
    // For the default locale (now guaranteed for new visitors), REWRITE the URL.
    response = NextResponse.rewrite(
      new URL(`/${DEFAULT_LOCALE}${pathname}`, request.url)
    );
  } else {
    // For returning visitors with a non-default language cookie, REDIRECT.
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
    "/((?!api|_next/static|_next/image|assets|favicon.ico|sw.js|.*\\..*).*)",
  ],
};
