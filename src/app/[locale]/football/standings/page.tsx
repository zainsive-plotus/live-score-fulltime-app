import type { Metadata } from "next";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import { ListOrdered } from "lucide-react";
import { getI18n } from "@/lib/i18n/server";
import { generateHreflangTags } from "@/lib/hreflang";
import StandingsHubClient from "@/components/directory/StandingsHubClient";
import { Suspense } from "react";
import { FeaturedLeagueCardSkeleton } from "@/components/directory/FeaturedLeagueCard";
import RecentNewsWidget from "@/components/RecentNewsWidget";
import AdSlotWidget from "@/components/AdSlotWidget";
import Script from "next/script";
import { WithContext, CollectionPage, BreadcrumbList } from "schema-dts";
import StandingsSeoWidget from "@/components/directory/StandingsSeoWidget";
import { getStandingsLeagues } from "@/lib/data/directory"; // <-- Import the new data function

const PAGE_PATH = "/football/standings";
const BASE_URL = process.env.APP_URL || "http://localhost:3000";

// generateMetadata function remains the same...
export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const { locale } = params;
  const t = await getI18n(locale);
  const hreflangAlternates = await generateHreflangTags(PAGE_PATH, "", locale);
  const pageTitle = t("standings_hub_page_title");
  const pageDescription = t("standings_hub_page_description");

  return {
    title: pageTitle,
    description: pageDescription,
    alternates: hreflangAlternates,
  };
}

const StandingsPageSkeleton = () => (
  <div className="space-y-12">
    <div className="h-8 w-1/3 bg-gray-700 rounded-md mb-4"></div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <FeaturedLeagueCardSkeleton key={i} />
      ))}
    </div>
  </div>
);

export default async function FootballStandingsHubPage({
  params,
}: {
  params: { locale: string };
}) {
  const { locale } = params;
  const t = await getI18n(locale);

  // FETCH DATA DIRECTLY ON THE SERVER for the initial page load
  const initialData = await getStandingsLeagues({ page: 1, limit: 18 });

  const jsonLd: WithContext<CollectionPage | BreadcrumbList>[] = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: t("standings_hub_page_title"),
      description: t("standings_hub_page_description"),
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
        { "@type": "ListItem", position: 2, name: t("standings_hub_title") },
      ],
    },
  ];

  return (
    <>
      <Script
        id="standings-hub-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="container mx-auto flex-1 w-full lg:grid lg:grid-cols-[288px_1fr_288px] lg:gap-8 lg:items-start p-4 lg:p-0 lg:py-6">
          <Sidebar />
          <main className="min-w-0">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 bg-brand-purple/10 rounded-lg">
                <ListOrdered className="w-8 h-8 text-brand-purple" />
              </div>
              <div>
                <h1 className="text-4xl font-extrabold text-white">
                  {t("standings_hub_title")}
                </h1>
                <p className="text-brand-muted">
                  {t("standings_hub_subtitle")}
                </p>
              </div>
            </div>

            <Suspense fallback={<StandingsPageSkeleton />}>
              {/* Pass the server-fetched data directly as a prop */}
              <StandingsHubClient
                initialLeagues={initialData.leagues}
                initialPagination={initialData.pagination}
              />
            </Suspense>

            <StandingsSeoWidget locale={locale} />
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
