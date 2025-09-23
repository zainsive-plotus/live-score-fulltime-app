// ===== src/middleware.ts (FINAL & ROBUST) =====

import { NextRequest, NextResponse } from "next/server";
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from "./lib/i18n/config";

const I18N_COOKIE_NAME = "NEXT_LOCALE";

function getLocale(request: NextRequest): string {
  const cookieLocale = request.cookies.get(I18N_COOKIE_NAME)?.value;
  if (cookieLocale && SUPPORTED_LOCALES.includes(cookieLocale)) {
    return cookieLocale;
  }
  return DEFAULT_LOCALE;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const origin = request.nextUrl.origin;

  // --- MONGO-BASED REDIRECTION LOGIC ---
  try {
    // 1. Normalize the path to check (remove locale prefix if it exists)
    let pathToCheck = pathname;
    const firstSegment = pathname.split("/")[1];
    if (SUPPORTED_LOCALES.includes(firstSegment)) {
      pathToCheck = pathname.substring(firstSegment.length + 1) || "/";
    }

    // 2. Call our internal API endpoint. This is Edge-compatible.
    const redirectCheckUrl = new URL(
      `/api/redirects/check?pathname=${encodeURIComponent(pathToCheck)}`,
      origin
    );
    const redirectResponse = await fetch(redirectCheckUrl);

    // 3. If a redirect is found (200 OK), perform the redirect.
    if (redirectResponse.ok) {
      const { destination, status } = await redirectResponse.json();
      console.log(
        `[MIDDLEWARE_REDIRECT] Match found! Path: '${pathname}', Destination: '${destination}'`
      );
      return NextResponse.redirect(new URL(destination, request.url), status);
    }
  } catch (error) {
    console.error(
      "[MIDDLEWARE_REDIRECT] API call for redirects failed:",
      error
    );
  }
  // --- END REDIRECTION LOGIC ---

  // --- I18N LOGIC (No changes needed here) ---
  const pathnameHasLocale = SUPPORTED_LOCALES.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (pathnameHasLocale) {
    if (
      pathname.startsWith(`/${DEFAULT_LOCALE}/`) ||
      pathname === `/${DEFAULT_LOCALE}`
    ) {
      const newPath = pathname.replace(`/${DEFAULT_LOCALE}`, "");
      const url = new URL(newPath === "" ? "/" : newPath, request.url);
      return NextResponse.redirect(url);
    }
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
    "/((?!api/redirects/check|api|_next/static|_next/image|admin|login|favicon.ico|go/.*|.*\\.).*)",
  ],
};
