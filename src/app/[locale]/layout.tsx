// ===== src/app/[locale]/layout.tsx =====
import "../globals.css";
import Providers from "../providers";
import { LeagueProvider } from "@/context/LeagueContext";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import NextAuthProvider from "../NextAuthProvider";
import { Suspense } from "react";
import StickyFooterAd from "@/components/StickyFooterAd";
import Loading from "./loading";
import Footer from "@/components/Footer";
import { GoogleAnalytics } from "@next/third-parties/google";
import { I18nProviderClient } from "@/lib/i18n/client";
import { TimeZoneProvider } from "@/context/TimeZoneContext";
import { i18nCache } from "@/lib/i18n/i18n.cache";
import Script from "next/script";
import { inter } from "../fonts";

import { SUPPORTED_LOCALES } from "@/lib/i18n/config"; // ADD: Import your locales
import { getI18n } from "@/lib/i18n/server";
import ReferrerRule from "@/models/ReferrerRule";
import { headers } from "next/headers";

/**
 * A non-blocking function to handle referrer tracking directly on the server.
 * This runs in the Node.js runtime, allowing database access.
 */
async function handleReferrerTracking() {
  try {
    const headersList = headers();
    const referrer = (await headersList).get("referer");
    const host = (await headersList).get("host");
    const pathname = (await headersList).get("x-next-pathname") || "/";

    if (!referrer || new URL(referrer).hostname.includes(host || "")) {
      return;
    }

    // --- CORE CHANGE: Call our internal API instead of connecting to the DB ---
    // This is a "fire-and-forget" call. We do not await it.
    const internalApiUrl = new URL("/api/track/referrer-hit", `http://${host}`);

    fetch(internalApiUrl.toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Pass essential headers for the API to use for logging
        "x-forwarded-for": headersList.get("x-forwarded-for") || "",
        "user-agent": headersList.get("user-agent") || "",
      },
      body: JSON.stringify({
        sourceUrl: referrer, // Send the full referrer
        landingPage: pathname,
      }),
    }).catch((err) => {
      // Log the error but don't let it crash the page render
      console.error("[Layout Tracker] Fire-and-forget API call failed:", err);
    });
  } catch (error) {
    console.error("[Layout Tracker] A critical error occurred:", error);
  }
}

// ADD: generateStaticParams to pre-build for all supported locales
export async function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({
    locale,
  }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  // Call the tracking function. It runs in the background.
  handleReferrerTracking();
  const { locale } = await params;
  const t = await getI18n(locale);
  const translations = (await i18nCache.getTranslations(locale)) || {};

  return (
    // <-- 2. APPLY THE FONT VARIABLE TO THE HTML TAG
    <html lang={locale} className={inter.variable}>
      <head>
        {/* {process.env.NEXT_PUBLIC_NODE_ENV === "production" && (
          <Script src="./scripts/relic.js" />
        )} */}
        {process.env.NEXT_PUBLIC_NODE_ENV === "production" && (
          <Script
            id="google-tag-manager"
            strategy="afterInteractive"
          >{`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer','GTM-KXMPVSDD');`}</Script>
        )}
        <script
          src="https://analytics.ahrefs.com/analytics.js"
          data-key="bUq3rBCRyMMiFSPFiUUAxg"
          async
        ></script>
      </head>
      <body suppressHydrationWarning={true}>
        {process.env.NEXT_PUBLIC_NODE_ENV === "production" && (
          <noscript>
            <iframe
              src="https://www.googletagmanager.com/ns.html?id=GTM-KXMPVSDD"
              height="0"
              width="0"
              // style="display:none;visibility:hidden"
            ></iframe>
          </noscript>
        )}
        <Suspense fallback={<Loading />}>
          <NextAuthProvider>
            <Providers>
              <I18nProviderClient locale={locale} translations={translations}>
                <TimeZoneProvider>
                  <LeagueProvider>
                    <main>{children}</main>
                    <StickyFooterAd />
                    <Footer locale={locale} />
                  </LeagueProvider>
                </TimeZoneProvider>
              </I18nProviderClient>
            </Providers>
          </NextAuthProvider>
        </Suspense>
        {process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && (
          <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID} />
        )}
      </body>
    </html>
  );
}
