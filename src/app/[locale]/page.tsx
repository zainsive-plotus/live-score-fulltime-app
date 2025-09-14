// ===== src/app/[locale]/page.tsx =====

import { Suspense } from "react";
import { Metadata } from "next";
import Script from "next/script";
import { WithContext, WebSite, Organization } from "schema-dts";

import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import { MainContent } from "@/components/MainContent";
import { SidebarSkeleton } from "@/components/LayoutSkeletons";
import { generateHreflangTags } from "@/lib/hreflang";
import { getI18n } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";
// Import the new JSON file
import homepageMeta from "public/data/homepage-meta.json";

const BASE_URL =
  process.env.NEXT_PUBLIC_PUBLIC_APP_URL || "http://localhost:3000";
const METADATA_BASE_URL =
  process.env.NEXT_PUBLIC_PUBLIC_APP_URL || "http://localhost:3000";

interface HomePageProps {
  params: {
    locale: string;
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getI18n(locale);

  // Use locale-specific meta if it exists, otherwise fall back to the default
  const meta = (homepageMeta as any)[locale] || homepageMeta.default;

  const title = meta.title;
  const description = meta.description;

  const hreflangAlternates = await generateHreflangTags("/", "", locale);

  return {
    metadataBase: new URL(METADATA_BASE_URL),
    alternates: hreflangAlternates,
    title: title,
    description: description,
    icons: {
      icon: [{ url: "/favicon.ico", type: "image/png" }],
      apple: [{ url: "/apple-icon.png" }],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true },
    },
    openGraph: {
      title: title,
      description: description,
      url: `${METADATA_BASE_URL}/${locale === "tr" ? "" : locale}`,
      siteName: "Fanskor",
      images: [
        {
          url: `${METADATA_BASE_URL}/og-image.jpg`,
          width: 1200,
          height: 630,
          alt: t("og_image_alt_text"),
          // alt: "og_image_alt_text",
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

const jsonLd: WithContext<WebSite | Organization>[] = [
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Fanskor",
    url: BASE_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: `${BASE_URL}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  },
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Fanskor",
    url: BASE_URL,
    logo: `${BASE_URL}/fanskor-transparent.webp`,
  },
];

// --- CORE CHANGE: Removed data fetching from the page component body ---
export default async function HomePage({ params }: HomePageProps) {
  return (
    <>
      <Script
        id="homepage-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="container mx-auto flex-1 w-full lg:grid lg:grid-cols-[288px_1fr] lg:items-start lg:py-8">
          <Suspense fallback={<SidebarSkeleton />}>
            <Sidebar />
          </Suspense>
          <main className="min-w-0">
            <MainContent />
          </main>
        </div>
      </div>
    </>
  );
}
