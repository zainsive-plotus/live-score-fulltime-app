// ===== src/middleware.ts (FINAL & ROBUST) =====

import { NextRequest, NextResponse } from "next/server";
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from "./lib/i18n/config";

const I18N_COOKIE_NAME = "NEXT_LOCALE";
const NEXT_PUBLIC_APP_URL =
  process.env.NEXT_PUBLIC_PUBLIC_APP_URL || "http://localhost:3000";
const REDIRECT_LOCALES = new Set(["de", "ar"]);

function getLocale(request: NextRequest): string {
  const cookieLocale = request.cookies.get(I18N_COOKIE_NAME)?.value;
  if (cookieLocale && SUPPORTED_LOCALES.includes(cookieLocale)) {
    return cookieLocale;
  }
  return DEFAULT_LOCALE;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const firstPathSegment = pathname.split("/")[1];
  if (REDIRECT_LOCALES.has(firstPathSegment)) {
    // It's a path like /de/some-page or /ar/football/news
    // We want to redirect it to /some-page (which will be handled by i18n logic)
    const newPath = pathname.replace(`/${firstPathSegment}`, "");
    const url = new URL(newPath === "" ? "/" : newPath, request.url);

    // Use a 301 Permanent Redirect for SEO
    return NextResponse.redirect(url, 301);
  }

  try {
    let pathToCheck = pathname;
    const firstSegment = pathname.split("/")[1];
    if (SUPPORTED_LOCALES.includes(firstSegment)) {
      pathToCheck = pathname.substring(firstSegment.length + 1) || "/";
    }

    // Use the explicit environment variable for the API call's origin.
    const redirectCheckUrl = new URL(
      `/api/redirects/check?pathname=${encodeURIComponent(pathToCheck)}`,
      NEXT_PUBLIC_APP_URL
    );

    // Use the AbortController for a short timeout to prevent middleware delays.
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1500); // 1.5 second timeout

    const redirectResponse = await fetch(redirectCheckUrl, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (redirectResponse.ok) {
      const { destination, status } = await redirectResponse.json();
      console.log(
        `[MIDDLEWARE_REDIRECT] Match found! Path: '${pathname}', Destination: '${destination}'`
      );
      return NextResponse.redirect(new URL(destination, request.url), status);
    }
  } catch (error: any) {
    if (error.name === "AbortError") {
      console.error("[MIDDLEWARE_REDIRECT] API call timed out.");
    } else {
      console.error(
        "[MIDDLEWARE_REDIRECT] API call for redirects failed:",
        error
      );
    }
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
