// ===== src/app/[locale]/page.tsx =====

import { Suspense } from "react";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import { MainContent } from "@/components/MainContent";
import { SidebarSkeleton } from "@/components/LayoutSkeletons";
import { getI18n } from "@/lib/i18n/server";
import { Metadata } from "next";
import { generateHreflangTags } from "@/lib/hreflang";
import { WithContext, WebSite, Organization } from "schema-dts"; // ADD: Import schema types
import Script from "next/script";

const BASE_URL =
  process.env.NEXT_PUBLIC_PUBLIC_APP_URL || "http://localhost:3000";

interface HomePageProps {
  params: {
    locale: string;
  };
  homepageAboutSeoText?: string;
  sidebarAboutSeoText?: string;
}

const METADATA_BASE_URL =
  process.env.NEXT_PUBLIC_PUBLIC_APP_URL || "http://localhost:3000";

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
      googleBot: { index: true, follow: true },
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

const jsonLd: WithContext<WebSite | Organization>[] = [
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Fan Skor",
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
    name: "Fan Skor",
    url: BASE_URL,
    logo: `${BASE_URL}/fanskor-transparent.webp`,
  },
];

export default async function HomePage({
  params,
  homepageAboutSeoText: initialHomepageText,
  sidebarAboutSeoText: initialSidebarText,
}: HomePageProps) {
  const { locale } = await params;

  const t = await getI18n(locale);

  const title = t("homepage_meta_title");
  const description = t("homepage_meta_description");

  // const homepageAboutSeoText =
  //   initialHomepageText || t("homepage_about_seo_text");
  // const sidebarAboutSeoText = initialSidebarText || t("sidebar_about_seo_text");

  return (
    <>
      <Script
        id="homepage-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <title>{title}</title>
      <meta name="description" content={description} />
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="container mx-auto flex-1 w-full lg:grid lg:grid-cols-[288px_1fr] lg:items-start lg:py-8">
          {/* ***** FIX IS HERE: Lazy-load the entire Sidebar ***** */}
          <Suspense fallback={<SidebarSkeleton />}>
            <Sidebar />
          </Suspense>

          <main className="min-w-0">
            <MainContent
            // sidebarAboutSeoText={sidebarAboutSeoText}
            // homepageAboutSeoText={homepageAboutSeoText}
            />
          </main>
        </div>
      </div>
    </>
  );
}
