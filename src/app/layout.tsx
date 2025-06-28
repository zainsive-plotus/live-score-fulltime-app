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

export const metadata: Metadata = {
  title: "Fan Skor | Türkiye'nin 1 numaralı Canlı Skor sitesi",
  description:
    "Oyuntaktik.com, Türkiye'nin bir numaralı inceleme sitesi, en iyi oyun rehberleri, taktikler ve güncel değerlendirmelerle oyuncuların yanında!",
  icons: {
    icon: [
      { url: "/favicon.ico", type: "image/png" }, // For modern browsers
    ],
    apple: [
      { url: "/favicon.ico" }, // For iOS
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
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
