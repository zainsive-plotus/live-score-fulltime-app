import { NextRequest, NextResponse } from "next/server";
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from "./lib/i18n/config";
import redis from "@/lib/redis";
// Define a constant for our Redis cache key to avoid typos
export const REFERRER_RULES_CACHE_KEY = "referrer-rules:active-list";

const I18N_COOKIE_NAME = "NEXT_LOCALE";

// async function handleReferrerTracking(request: NextRequest) {
//   try {
//     const referrer = request.headers.get("referer");
//     const ownHost = request.nextUrl.hostname;

//     // 1. Quick exit if there's no referrer or if it's from our own site
//     if (!referrer || new URL(referrer).hostname === ownHost) {
//       return;
//     }

//     // 2. Fetch the active tracking rules from Redis cache
//     const cachedRules = await redis.get(REFERRER_RULES_CACHE_KEY);
//     if (!cachedRules) {
//       return; // No rules in cache, do nothing
//     }

//     const activeSourceUrls: string[] = JSON.parse(cachedRules);
//     if (activeSourceUrls.length === 0) {
//       return;
//     }

//     // 3. Check if the incoming referrer matches any of our rules
//     // We check if the referrer *starts with* a rule URL to account for query params, etc.
//     const matchedRule = activeSourceUrls.find((ruleUrl) =>
//       referrer.startsWith(ruleUrl)
//     );

//     if (matchedRule) {
//       // 4. If a match is found, make a "fire-and-forget" request to our logging API
//       // We do NOT `await` this call, so the user's request is not blocked.
//       const loggingUrl = new URL("/api/track/referrer-hit", request.url);
//       fetch(loggingUrl.toString(), {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           // Forward necessary headers for analytics
//           "x-forwarded-for":
//             request.headers.get("x-forwarded-for") || request.ip || "",
//           "user-agent": request.headers.get("user-agent") || "",
//         },
//         body: JSON.stringify({
//           sourceUrl: matchedRule,
//           landingPage: request.nextUrl.pathname,
//         }),
//       }).catch((err) => {
//         // Log errors but don't let them affect the user's request
//         console.error("[Middleware] Referrer logging fetch failed:", err);
//       });
//     }
//   } catch (error) {
//     // Catch any unexpected errors in the tracking logic to ensure it never crashes the middleware
//     console.error("[Middleware] Referrer tracking logic failed:", error);
//   }
// }

function getLocale(request: NextRequest): string {
  const cookieLocale = request.cookies.get(I18N_COOKIE_NAME)?.value;
  if (cookieLocale && SUPPORTED_LOCALES.includes(cookieLocale)) {
    return cookieLocale;
  }
  return DEFAULT_LOCALE;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // handleReferrerTracking(request);

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
    // Add 'login' to the list of paths to ignore in the negative lookahead
    "/((?!api|_next/static|_next/image|admin|login|favicon.ico|go/.*|.*\\.).*)",
  ],
};
