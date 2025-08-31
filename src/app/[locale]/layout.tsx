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
import { Metadata } from "next";
import { generateHreflangTags } from "@/lib/hreflang";

const METADATA_BASE_URL =
  process.env.NEXT_PUBLIC_PUBLIC_APP_URL || "http://localhost:3000";

// ADD: generateStaticParams to pre-build for all supported locales
export async function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({
    locale,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getI18n(locale);
  const hreflangAlternates = await generateHreflangTags("/", "", locale);
  const title = t("homepage_meta_title");
  const description = t("homepage_meta_description");

  return {
    metadataBase: new URL(METADATA_BASE_URL),
    alternates: hreflangAlternates,
    // title: title,
    // description: description,
    icons: {
      icon: [{ url: "/favicon.ico", type: "image/png" }],
      apple: [{ url: "/favicon.ico" }],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
      },
    },
    openGraph: {
      title: title,
      description: description,
      url: `${METADATA_BASE_URL}/${locale === "tr" ? "" : locale}`,
      siteName: "Fan Skor",
      images: [
        {
          url: `${METADATA_BASE_URL}/og-image.jpg`,
          width: 1200,
          height: 630,
          alt: t("og_image_alt_text"),
        },
      ],
      locale: locale,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: title,
      description: description,
      creator: "@fanskor_official",
      images: [`${METADATA_BASE_URL}/twitter-image.jpg`],
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const { locale } = await params;
  const t = await getI18n(locale);
  const translations = (await i18nCache.getTranslations(locale)) || {};

  const title = t("homepage_meta_title");
  const description = t("homepage_meta_description");

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
        <title>{title}</title>
        <meta name="description" content={description} />
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
