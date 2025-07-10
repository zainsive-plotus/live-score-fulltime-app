import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import { LeagueProvider } from "@/context/LeagueContext";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { LanguageProvider } from "@/context/LanguageContext";
import NextAuthProvider from "./NextAuthProvider";
import { Suspense } from "react";
import StickyFooterAd from "@/components/StickyFooterAd";
import Loading from "./loading";
import Footer from "@/components/Footer";

const inter = Inter({ subsets: ["latin"] });

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
  // --- ADDED DEFAULT OPEN GRAPH TAGS ---
  openGraph: {
    title: "Fan Skor | Canlı Skorlar, Tahminler ve En İyi Futbol Ligleri",
    description:
      "Fan Skor, canlı skorlar, haberler, tahminler, en iyi ligler, takım istatistikleri, uzman makaleleri ve güvenilir ortaklıkları tek bir platformda sunar.",
    url: METADATA_BASE_URL, // Canonical URL for the site root
    siteName: "Fan Skor",
    images: [
      {
        url: `${METADATA_BASE_URL}/og-image.jpg`, // You should create this image in your public folder
        width: 1200,
        height: 630,
        alt: "Fan Skor - Türkiye Canlı Skor Sitesi",
      },
    ],
    locale: "en_US", // Default locale, can be changed dynamically by pages if i18n is used
    type: "website",
  },
  // --- ADDED DEFAULT TWITTER CARD TAGS ---
  twitter: {
    card: "summary_large_image",
    title: "Fan Skor | Canlı Skorlar, Tahminler ve En İyi Futbol Ligleri",
    description:
      "Fan Skor, canlı skorlar, haberler, tahminler, en iyi ligler, takım istatistikleri, uzman makaleleri ve güvenilir ortaklıkları tek bir platformda sunar.",
    creator: "@fanskor_official", // Your Twitter handle
    images: [`${METADATA_BASE_URL}/twitter-image.jpg`], // You should create this image in your public folder
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr">
      <body
        className={`${inter.className} bg-background text-text-primary`}
        suppressHydrationWarning={true}
      >
        <Suspense fallback={<Loading />}>
          <NextAuthProvider>
            <Providers>
              <LanguageProvider>
                <LeagueProvider>
                  <main>{children}</main>
                  <StickyFooterAd />
                  <Footer />
                </LeagueProvider>
              </LanguageProvider>
            </Providers>
          </NextAuthProvider>
        </Suspense>
      </body>
    </html>
  );
}
