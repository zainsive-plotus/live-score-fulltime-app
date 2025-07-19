import { NextRequest, NextResponse } from "next/server";
import Negotiator from "negotiator";

const I18N_COOKIE_NAME = "NEXT_LOCALE";
const SUPPORTED_LOCALES = ["tr", "en", "fr", "es", "zu", "it"];
const DEFAULT_LOCALE = "tr";

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

  // --- START OF NEW LOGIC ---
  // 1. Check if the path is for an admin route, the login page, or an API call.
  // If it is, do not perform any i18n routing.
  if (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/api")
  ) {
    return NextResponse.next();
  }
  // --- END OF NEW LOGIC ---

  const pathnameHasLocale = SUPPORTED_LOCALES.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (pathnameHasLocale) {
    return NextResponse.next();
  }

  const detectedLocale = getLocale(request);
  let response: NextResponse;

  if (detectedLocale === DEFAULT_LOCALE) {
    response = NextResponse.rewrite(
      new URL(`/${DEFAULT_LOCALE}${pathname}`, request.url)
    );
  } else {
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
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - assets (static assets)
     * - favicon.ico (favicon file)
     * - sw.js (service worker)
     * - and any file with an extension (e.g., .svg, .png)
     */
    "/((?!_next/static|_next/image|assets|favicon.ico|sw.js|.*\\..*).*)",
  ],
};
