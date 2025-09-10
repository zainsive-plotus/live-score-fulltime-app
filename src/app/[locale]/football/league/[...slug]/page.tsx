// ===== src/app/[locale]/football/league/[...slug]/page.tsx =====

import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Script from "next/script";
import { WithContext, SportsEvent, BreadcrumbList } from "schema-dts";

import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import AdSlotWidget from "@/components/AdSlotWidget";
import RecentNewsWidget from "@/components/RecentNewsWidget";
import LeagueDetailWidget from "@/components/directory/LeagueDetailWidget";
import LeagueSeoWidget from "@/components/league-detail-view/LeagueSeoWidget";
import LeagueHeader from "@/components/league-detail-view/LeagueHeader";
import LeagueStandingsWidget from "@/components/league-detail-view/LeagueStandingsWidget";
import LeagueFixturesWidget from "@/components/league-detail-view/LeagueFixturesWidget";
import LeagueTeamsList from "@/components/league-detail-view/LeagueTeamsList";

import { getI18n } from "@/lib/i18n/server";
import { generateHreflangTags } from "@/lib/hreflang";
import { getLeaguesStaticData } from "@/lib/data/league-static"; // <-- IMPORT STATIC LOADER
import { getLeaguePageData } from "@/lib/data/league"; // For dynamic data
import { generateStandingsSlug } from "@/lib/generate-standings-slug";
import { format } from "date-fns";

const BASE_URL =
  process.env.NEXT_PUBLIC_PUBLIC_APP_URL || "http://localhost:3000";

const getLeagueIdFromSlug = (slug: string): string | null => {
  if (!slug) return null;
  const parts = slug.split("-");
  const lastPart = parts[parts.length - 1];
  return /^\d+$/.test(lastPart) ? lastPart : null;
};

// This function now uses the fast static data for metadata
export async function generateMetadata({
  params,
}: {
  params: { slug: string[]; locale: string };
}): Promise<Metadata> {
  const { slug, locale } = params;
  const t = await getI18n(locale);
  const leagueId = getLeagueIdFromSlug(slug[0]);

  const hreflangAlternates = await generateHreflangTags(
    "/football/league",
    slug.join("/"),
    locale
  );

  if (!leagueId) {
    return { title: t("not_found_title"), alternates: hreflangAlternates };
  }

  const allLeagues = await getLeaguesStaticData();
  const leagueInfo = allLeagues.find((l) => l.id.toString() === leagueId);

  if (!leagueInfo) {
    return {
      title: t("not_found_title"),
      alternates: hreflangAlternates,
      robots: { index: false, follow: false },
    };
  }

  return {
    title: t("league_page_title", {
      leagueName: leagueInfo.name,
      countryName: leagueInfo.countryName,
    }),
    description: t("league_page_description", {
      leagueName: leagueInfo.name,
      countryName: leagueInfo.countryName,
    }),
    alternates: hreflangAlternates,
  };
}

export default async function LeaguePage({
  params,
}: {
  params: { slug: string[]; locale: string };
}) {
  const { slug, locale } = params;
  const t = await getI18n(locale);
  const leagueId = getLeagueIdFromSlug(slug[0]);
  if (!leagueId) notFound();

  // --- CORE CHANGE: Fetch static data first, then dynamic data ---
  const allLeagues = await getLeaguesStaticData();
  const staticLeagueInfo = allLeagues.find((l) => l.id.toString() === leagueId);
  if (!staticLeagueInfo) notFound();

  // Fetch the rest of the dynamic data needed for the page
  const dynamicLeagueData = await getLeaguePageData(leagueId);
  if (!dynamicLeagueData) notFound();

  const { league, country, seasons, standings, topScorer, leagueStats } =
    dynamicLeagueData;

  const currentSeason =
    seasons.find((s: any) => s.current === true) || seasons[0];
  const currentSeasonYear = currentSeason.year;
  const standingsSlug = generateStandingsSlug(league.name, league.id);

  // SEO Widget and JSON-LD generation can continue as before
  // ... (Your seoWidgetText and jsonLd generation logic remains the same)
  const seoWidgetText = `...`; // Keep your existing SEO text generation logic here
  const jsonLd: WithContext<SportsEvent | BreadcrumbList>[] = [
    /* ... as before ... */
  ];

  return (
    <>
      <Script
        id="league-page-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="container mx-auto flex-1 w-full lg:grid lg:grid-cols-[288px_1fr_288px] lg:gap-8 lg:items-start p-4 lg:p-0 lg:py-6">
          <Sidebar />

          <main className="min-w-0 space-y-8">
            {/* The header can be rendered instantly with static data */}
            <LeagueHeader
              league={{
                name: staticLeagueInfo.name,
                logo: staticLeagueInfo.logoUrl,
                type: staticLeagueInfo.type,
              }}
              country={{
                name: staticLeagueInfo.countryName,
                flag: staticLeagueInfo.countryFlagUrl,
              }}
              currentSeason={currentSeasonYear}
            />

            {/* The rest of the components will use the dynamically fetched data */}
            {league.type === "League" && (
              <LeagueStandingsWidget
                initialStandings={standings}
                leagueSeasons={seasons
                  .map((s: any) => s.year)
                  .sort((a: number, b: number) => b - a)}
                currentSeason={currentSeasonYear}
                isLoading={false}
                leagueId={league.id}
                leagueSlug={standingsSlug}
              />
            )}

            <LeagueFixturesWidget
              leagueId={league.id}
              season={currentSeasonYear}
            />

            <LeagueTeamsList
              leagueId={league.id}
              season={currentSeasonYear}
              countryName={country.name}
              countryFlag={country.flag}
            />

            <LeagueSeoWidget
              season={currentSeasonYear}
              leagueName={league.name}
              title={t("league_seo_widget_title", { leagueName: league.name })}
              seoText={seoWidgetText}
            />
          </main>

          <aside className="hidden lg:block lg:col-span-1 space-y-8 min-w-0">
            <LeagueDetailWidget
              league={league}
              leagueStats={leagueStats}
              topScorer={topScorer}
            />
            <RecentNewsWidget />
            <AdSlotWidget location="homepage_right_sidebar" />
          </aside>
        </div>
      </div>
    </>
  );
}
