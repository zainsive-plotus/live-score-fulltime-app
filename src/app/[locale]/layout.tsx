// ===== src/app/[locale]/layout.tsx =====
import type { Metadata } from "next";
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
import { inter } from "../fonts"; // <-- 1. IMPORT THE FONT

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const { locale } = await params;
  const translations = (await i18nCache.getTranslations(locale)) || {};

  return (
    // <-- 2. APPLY THE FONT VARIABLE TO THE HTML TAG
    <html lang={locale} className={inter.variable}>
      <head>
        {process.env.NEXT_PUBLIC_NODE_ENV === "production" && (
          <Script src="./scripts/relic.js" />
        )}
        <script
          src="https://analytics.ahrefs.com/analytics.js"
          data-key="bUq3rBCRyMMiFSPFiUUAxg"
          async
        ></script>
      </head>
      <body suppressHydrationWarning={true}>
        <Suspense fallback={<Loading />}>
          <NextAuthProvider>
            <Providers>
              <I18nProviderClient locale={locale} translations={translations}>
                <TimeZoneProvider>
                  <LeagueProvider>
                    <main>{children}</main>
                    <StickyFooterAd />
                    <Footer />
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
