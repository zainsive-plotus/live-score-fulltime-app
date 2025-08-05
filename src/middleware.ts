// ===== src/middleware.ts =====
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

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // The logic inside the middleware is correct, the problem is the matcher below.
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

// THE FIX IS HERE: We add 'admin' to the negative lookahead
export const config = {
  matcher: [
    // This regex matches all paths except for the ones starting with:
    // - api (API routes)
    // - _next/static (static files)
    // - _next/image (image optimization files)
    // - admin (admin routes) <-- THIS IS THE FIX
    // - any file with an extension (e.g., .xml, .svg, .png)
    "/((?!api|_next/static|_next/image|admin|favicon.ico|.*\\.).*)",
  ],
};
