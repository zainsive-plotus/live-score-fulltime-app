// ===== src/middleware.ts =====

import { NextRequest, NextResponse } from "next/server";
// ***** FIX: Import constants from the new, safe config file *****
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from "./lib/i18n/config";

const I18N_COOKIE_NAME = "NEXT_LOCALE";

function getLocale(request: NextRequest): string {
  const cookieLocale = request.cookies.get(I18N_COOKIE_NAME)?.value;
  if (cookieLocale && SUPPORTED_LOCALES.includes(cookieLocale)) {
    return cookieLocale;
  }
  return DEFAULT_LOCALE;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Paths to exclude from localization logic
  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/_next") ||
    pathname.includes(".") // This covers /sitemap.xml, /favicon.ico, etc.
  ) {
    return NextResponse.next();
  }

  const pathnameHasLocale = SUPPORTED_LOCALES.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (pathnameHasLocale) {
    // If the path has the default locale prefix, remove it and redirect.
    // e.g., /tr/some-page -> /some-page
    if (
      pathname.startsWith(`/${DEFAULT_LOCALE}/`) ||
      pathname === `/${DEFAULT_LOCALE}`
    ) {
      const newPath = pathname.replace(`/${DEFAULT_LOCALE}`, "");
      const url = new URL(newPath === "" ? "/" : newPath, request.url);
      return NextResponse.redirect(url);
    }
    // If it has a non-default locale prefix, it's a valid URL.
    return NextResponse.next();
  }

  // The path does not have a locale prefix.
  // We need to determine the correct locale and either redirect or rewrite.
  const detectedLocale = getLocale(request);
  let response: NextResponse;

  if (detectedLocale === DEFAULT_LOCALE) {
    // If the detected locale is the default one, we don't need a prefix.
    // We rewrite the URL internally to the correct Next.js page path (/tr/...)
    // without changing the URL the user sees.
    response = NextResponse.rewrite(
      new URL(`/${DEFAULT_LOCALE}${pathname}`, request.url)
    );
  } else {
    // If the detected locale is not the default, we must redirect to include the prefix.
    // e.g., /some-page -> /en/some-page
    response = NextResponse.redirect(
      new URL(`/${detectedLocale}${pathname}`, request.url)
    );
  }

  // Set the locale cookie for future requests
  response.cookies.set(I18N_COOKIE_NAME, detectedLocale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365, // 1 year
  });

  return response;
}

export const config = {
  matcher: [
    // Skip all internal paths (_next) and assets
    // The negative lookahead ?! is used to exclude specific paths
    "/((?!api|_next/static|_next/image|assets|favicon.ico|sw.js|.*\\.xml$).*)",
  ],
};
