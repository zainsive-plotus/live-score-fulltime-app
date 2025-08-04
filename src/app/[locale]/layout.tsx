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
import { getI18n } from "@/lib/i18n/server";
import { I18nProviderClient } from "@/lib/i18n/client";
import { TimeZoneProvider } from "@/context/TimeZoneContext";
import { i18nCache } from "@/lib/i18n/i18n.cache";
import { generateHreflangTags } from "@/lib/hreflang";

const METADATA_BASE_URL =
  process.env.NEXT_PUBLIC_PUBLIC_APP_URL || "http://localhost:3000";

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getI18n(locale);
  const hreflangAlternates = await generateHreflangTags("/", locale);
  const title = t("homepage_meta_title");
  const description = t("homepage_meta_description");

  return {
    metadataBase: new URL(METADATA_BASE_URL),
    alternates: hreflangAlternates,

    // ***** FIX IS HERE: Use the title template object *****
    title: {
      default: title, // Title for the homepage (e.g., /en, /fr)
      template: `%s | Fan Skor`, // Pattern for all other pages
    },

    description: description,
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
  const translations = (await i18nCache.getTranslations(locale)) || {};

  return (
    <>
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
    </>
  );
}
