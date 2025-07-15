import type { Metadata } from "next";
import "./globals.css";
import Providers from "./providers";
import { LeagueProvider } from "@/context/LeagueContext";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import NextAuthProvider from "./NextAuthProvider";
import { Suspense } from "react";
import StickyFooterAd from "@/components/StickyFooterAd";
import Loading from "./loading";
import Footer from "@/components/Footer";

import { GoogleAnalytics } from "@next/third-parties/google";

// New imports for our dynamic i18n system
import { getLocale } from "@/lib/i18n/server";
import { i18nCache } from "@/lib/i18n/i18n.cache";
import { I18nProviderClient } from "@/lib/i18n/client";

const METADATA_BASE_URL =
  process.env.NEXT_PUBLIC_PUBLIC_APP_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(METADATA_BASE_URL),
  alternates: {
    canonical: "/",
  },
  title: "Fan Skor | Canlı Skorlar, Tahminler ve En İyi Futbol Ligleri",
  description:
    "Fan Skor, canlı skorlar, haberler, tahminler, en iyi ligler, takım istatistikleri, uzman makaleleri ve güvenilir ortaklıkları tek bir platformda sunar.",
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
    title: "Fan Skor | Canlı Skorlar, Tahminler ve En İyi Futbol Ligleri",
    description:
      "Fan Skor, canlı skorlar, haberler, tahminler, en iyi ligler, takım istatistikleri, uzman makaleleri ve güvenilir ortaklıkları tek bir platformda sunar.",
    url: METADATA_BASE_URL,
    siteName: "Fan Skor",
    images: [
      {
        url: `${METADATA_BASE_URL}/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: "Fan Skor - Türkiye Canlı Skor Sitesi",
      },
    ],
    locale: "en_US", // This can be made dynamic later if needed
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Fan Skor | Canlı Skorlar, Tahminler ve En İyi Futbol Ligleri",
    description:
      "Fan Skor, canlı skorlar, haberler, tahminler, en iyi ligler, takım istatistikleri, uzman makaleleri ve güvenilir ortaklıkları tek bir platformda sunar.",
    creator: "@fanskor_official",
    images: [`${METADATA_BASE_URL}/twitter-image.jpg`],
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const translations = (await i18nCache.getTranslations(locale)) || {};

  return (
    <html lang={locale}>
      <head>
        {process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && (
          <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID} />
        )}
      </head>
      <body
        className={`bg-background text-text-primary`}
        suppressHydrationWarning={true}
      >
        <Suspense fallback={<Loading />}>
          <NextAuthProvider>
            <Providers>
              {/* The new I18nProviderClient wraps everything */}
              <I18nProviderClient locale={locale} translations={translations}>
                <LeagueProvider>
                  <main>{children}</main>

                  <StickyFooterAd />
                  <Footer />
                </LeagueProvider>
              </I18nProviderClient>
            </Providers>
          </NextAuthProvider>
        </Suspense>
      </body>
    </html>
  );
}
