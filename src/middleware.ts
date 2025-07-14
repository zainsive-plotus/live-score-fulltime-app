import { NextRequest, NextResponse } from "next/server";
import Negotiator from "negotiator";

const I18N_COOKIE_NAME = "NEXT_LOCALE";

// This is a simplified, hardcoded list for the middleware.
// The definitive list of *active* languages is still in the database.
const SUPPORTED_LOCALES = ["tr", "en", "de", "fr", "es", "ar"];
const DEFAULT_LOCALE = "tr";

function getLocaleFromRequest(request: NextRequest): string {
  // 1. Check for user's cookie override
  const cookieLocale = request.cookies.get(I18N_COOKIE_NAME)?.value;
  if (cookieLocale && SUPPORTED_LOCALES.includes(cookieLocale)) {
    return cookieLocale;
  }

  // 2. Check Accept-Language header
  const languages = new Negotiator({
    headers: {
      "accept-language": request.headers.get("accept-language") || "",
    },
  }).languages();

  // Using Intl.LocaleMatcher is more modern, but Negotiator is very robust and common in middleware.
  // We find the first match between browser languages and our supported ones.
  return (
    languages.find((lang) => SUPPORTED_LOCALES.includes(lang.split("-")[0])) ||
    DEFAULT_LOCALE
  );
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isExcluded =
    /^\/(api|static|_next|images|fonts)\/|.*\.(ico|png|jpg|jpeg|gif|svg|webp)$/.test(
      pathname
    );
  if (isExcluded) {
    return NextResponse.next();
  }

  const locale = getLocaleFromRequest(request);

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-user-locale", locale);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|assets|favicon.ico|sw.js).*)"],
};
