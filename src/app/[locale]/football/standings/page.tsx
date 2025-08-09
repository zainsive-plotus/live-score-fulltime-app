// ===== src/app/[locale]/football/standings/page.tsx =====

import type { Metadata } from "next";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import { ListOrdered } from "lucide-react";
import { getI18n } from "@/lib/i18n/server";
import { generateHreflangTags } from "@/lib/hreflang";
import { League } from "@/types/api-football";
import axios from "axios";
import StandingsHubClient from "@/components/directory/StandingsHubClient";
import { Suspense } from "react";
import { FeaturedLeagueCardSkeleton } from "@/components/directory/FeaturedLeagueCard";
// ***** Import widgets for the right sidebar *****
import RecentNewsWidget from "@/components/RecentNewsWidget";
import AdSlotWidget from "@/components/AdSlotWidget";

const PAGE_PATH = "/football/standings";
const BASE_URL =
  process.env.NEXT_PUBLIC_PUBLIC_APP_URL || "http://localhost:3000";

async function getStandingsLeagues(): Promise<League[]> {
  try {
    const { data } = await axios.get(
      `${BASE_URL}/api/directory/standings-leagues`
    );
    return data;
  } catch (error) {
    console.error(
      "[Standings Hub Page] Failed to fetch standings leagues:",
      error
    );
    return [];
  }
}

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
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
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = await getI18n(locale);
  const leagues = await getStandingsLeagues();

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      {/* ***** UPDATED LAYOUT to three columns ***** */}
      <div className="container mx-auto flex-1 w-full lg:grid lg:grid-cols-[288px_1fr_288px] lg:gap-8 lg:items-start">
        <Sidebar />
        <main className="min-w-0 p-4 lg:p-0 lg:py-6">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-brand-purple/10 rounded-lg">
              <ListOrdered className="w-8 h-8 text-brand-purple" />
            </div>
            <div>
              <h1 className="text-4xl font-extrabold text-white">
                {t("standings_hub_title")}
              </h1>
              <p className="text-brand-muted">{t("standings_hub_subtitle")}</p>
            </div>
          </div>

          <Suspense fallback={<StandingsPageSkeleton />}>
            <StandingsHubClient leagues={leagues} />
          </Suspense>
        </main>
        {/* ***** RIGHT SIDEBAR ADDED ***** */}
        <aside className="hidden lg:block lg:col-span-1 space-y-8 min-w-0">
          <RecentNewsWidget />
          <AdSlotWidget location="homepage_right_sidebar" />
        </aside>
      </div>
    </div>
  );
}
