// ===== src/app/[locale]/football/standings/[...slug]/page.tsx =====

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import { getI18n } from "@/lib/i18n/server";
import { generateHreflangTags } from "@/lib/hreflang";
import axios from "axios";
import AdSlotWidget from "@/components/AdSlotWidget";
import RecentNewsWidget from "@/components/RecentNewsWidget";
import LeagueDetailWidget from "@/components/directory/LeagueDetailWidget";
import { generateStandingsSlug } from "@/lib/generate-standings-slug";
import StandingsPageClient from "./StandingsPageClient"; // <-- Import the new Client Component

const BASE_URL =
  process.env.NEXT_PUBLIC_PUBLIC_APP_URL || "http://localhost:3000";

const getLeagueIdFromSlug = (slug: string): string | null => {
  if (!slug) return null;
  const parts = slug.split("-");
  const lastPart = parts[parts.length - 1];
  return /^\d+$/.test(lastPart) ? lastPart : null;
};

// This function fetches data for the CURRENT season for metadata generation
async function getInitialStandingsData(leagueId: string) {
  try {
    const season = new Date().getFullYear().toString();
    const { data } = await axios.get(
      `${BASE_URL}/api/standings?league=${leagueId}&season=${season}`
    );
    return data;
  } catch (error) {
    return null;
  }
}

// generateMetadata STAYS HERE in the Server Component
export async function generateMetadata({
  params,
}: {
  params: { slug: string[]; locale: string };
}): Promise<Metadata> {
  const { slug, locale } = params;
  const t = await getI18n(locale);
  const leagueId = getLeagueIdFromSlug(slug[0]);

  if (!leagueId) {
    return { title: t("not_found_title") };
  }

  const initialData = await getInitialStandingsData(leagueId);

  if (!initialData || !initialData.league) {
    return { title: t("not_found_title") };
  }

  const { league } = initialData;
  const pagePath = `/football/standings/${slug.join("/")}`;
  const hreflangAlternates = await generateHreflangTags(pagePath, locale);

  const pageTitle = t("standings_detail_page_title", {
    leagueName: league.name,
    season: league.season,
  });
  const pageDescription = t("standings_detail_page_description", {
    leagueName: league.name,
  });

  return {
    title: pageTitle,
    description: pageDescription,
    alternates: hreflangAlternates,
  };
}

// The default export is now the Server Component Page
export default async function LeagueStandingsPage({
  params,
}: {
  params: { slug: string[]; locale: string };
}) {
  const { slug } = params;
  const leagueId = getLeagueIdFromSlug(slug[0]);

  if (!leagueId) {
    notFound();
  }

  // Fetch initial data on the server
  const initialData = await getInitialStandingsData(leagueId);

  if (!initialData || !initialData.league) {
    notFound();
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="container mx-auto flex-1 w-full lg:grid lg:grid-cols-[288px_1fr_288px] lg:gap-8 lg:items-start p-4 lg:p-0 lg:py-6">
        <Sidebar />

        {/* Render the Client Component and pass initial data as props */}
        <StandingsPageClient initialData={initialData} leagueId={leagueId} />

        <aside className="hidden lg:block lg:col-span-1 space-y-8 min-w-0">
          {/* These can be client components, which is fine */}
          <LeagueDetailWidget
            league={initialData.league}
            leagueStats={initialData.leagueStats}
            topScorer={initialData.topScorer}
          />
          <RecentNewsWidget />
          <AdSlotWidget location="homepage_right_sidebar" />
        </aside>
      </div>
    </div>
  );
}

// generateStaticParams STAYS HERE in the Server Component
export async function generateStaticParams() {
  try {
    const { data: leagues } = await axios.get(
      `${BASE_URL}/api/directory/standings-leagues`
    );
    if (!leagues) return [];

    return leagues.map((league: any) => ({
      slug: [generateStandingsSlug(league.name, league.id)],
    }));
  } catch (error) {
    console.error(
      "[generateStaticParams] Failed to fetch leagues for standings pages:",
      error
    );
    return [];
  }
}
