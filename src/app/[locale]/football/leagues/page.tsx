// ===== src/app/[locale]/football/leagues/page.tsx =====

import type { Metadata } from "next";
// Removed axios and League type, as they are no longer needed here
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import LeagueListClient from "@/components/LeagueListClient";
import RecentNewsWidget from "@/components/RecentNewsWidget";
import AdSlotWidget from "@/components/AdSlotWidget";
import { getI18n } from "@/lib/i18n/server";
import { generateHreflangTags } from "@/lib/hreflang";
import { WithContext, CollectionPage, BreadcrumbList } from "schema-dts"; // ADD: Import schema types
import Script from "next/script";

const PAGE_PATH = "/football/leagues";
const BASE_URL =
  process.env.NEXT_PUBLIC_PUBLIC_APP_URL || "http://localhost:3000";
export const dynamic = "force-dynamic";

// The server-side fetch function is no longer needed here.

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  const t = await getI18n(locale);
  const hreflangAlternates = await generateHreflangTags(PAGE_PATH, "", locale);

  const pageTitle = t("leagues_page_meta_title");
  const pageDescription = t("leagues_page_meta_description");

  return {
    title: pageTitle,
    description: pageDescription,
    alternates: hreflangAlternates,
    openGraph: {
      title: pageTitle,
      description: pageDescription,
      url: `${process.env.NEXT_PUBLIC_PUBLIC_APP_URL}/${locale}${PAGE_PATH}`,
      siteName: "FanSkor",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: pageTitle,
      description: pageDescription,
    },
  };
}

export default async function LeaguesPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  // --- THIS IS THE FIX ---
  // The server-side data fetch is removed.
  // const allLeagues = await fetchAllLeaguesServer();
  const t = await getI18n(locale);

  const leaguesPageSeoText = t("leagues_page_seo_text");

  // ADD: Define JSON-LD schema for this page
  const jsonLd: WithContext<CollectionPage | BreadcrumbList>[] = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: t("leagues_page_meta_title"),
      description: t("leagues_page_meta_description"),
      url: `${BASE_URL}/${locale}${PAGE_PATH}`,
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: t("homepage"),
          item: `${BASE_URL}/${locale}`,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: t("leagues_and_cups_title"),
        },
      ],
    },
  ];

  return (
    <>
      {" "}
      <Script
        id="leagues-page-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="container mx-auto flex-1 w-full lg:grid lg:grid-cols-[288px_1fr_288px] lg:gap-8 lg:items-start p-4 lg:p-0 lg:py-6">
          <Sidebar />
          <main className="min-w-0">
            <h1 className="text-4xl font-extrabold text-white mb-6">
              {t("leagues_and_cups_title")}
            </h1>
            <p className="italic text-[#a3a3a3] leading-relaxed mb-8">
              {leaguesPageSeoText}
            </p>
            {/* We now pass an empty array, the client component will fetch the data */}
            <LeagueListClient initialAllLeagues={[]} />
            {/* --- END OF FIX --- */}
          </main>
          <aside className="hidden lg:block lg:col-span-1 space-y-8 min-w-0">
            <RecentNewsWidget />
            <AdSlotWidget location="homepage_right_sidebar" />
          </aside>
        </div>
      </div>
    </>
  );
}
