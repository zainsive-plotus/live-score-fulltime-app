// ===== src/app/[locale]/football/league/[...slug]/page.tsx =====
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import axios from "axios";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getI18n } from "@/lib/i18n/server";
import { generateHreflangTags } from "@/lib/hreflang";

// --- Import New & Existing Widgets ---
import LeagueHeader from "@/components/league-detail-view/LeagueHeader";
import LeagueStandingsWidget from "@/components/league-detail-view/LeagueStandingsWidget";
import LeagueFixturesWidget from "@/components/league-detail-view/LeagueFixturesWidget";
import LeagueTeamsList from "@/components/league-detail-view/LeagueTeamsList";
import AdSlotWidget from "@/components/AdSlotWidget";
import RecentNewsWidget from "@/components/RecentNewsWidget";

const getLeagueIdFromSlug = (slug: string): string | null => {
  if (!slug) return null;
  const parts = slug.split("-");
  const lastPart = parts[parts.length - 1];
  return /^\d+$/.test(lastPart) ? lastPart : null;
};

// This single data fetching function gets all necessary data for the page
async function getLeaguePageData(leagueId: string): Promise<any | null> {
  try {
    const season = new Date().getFullYear();
    const options = (endpoint: string, params: object) => ({
      method: "GET",
      url: `${process.env.NEXT_PUBLIC_API_FOOTBALL_HOST}/${endpoint}`,
      params,
      headers: { "x-apisports-key": process.env.NEXT_PUBLIC_API_FOOTBALL_KEY },
    });

    // Fetch league details and standings in parallel
    const [leagueDetailsResponse, standingsResponse] = await Promise.all([
      axios.request(options("leagues", { id: leagueId })),
      axios.request(options("standings", { league: leagueId, season: season })),
    ]);

    const leagueData = leagueDetailsResponse.data.response[0];
    if (!leagueData) return null;

    leagueData.standings =
      standingsResponse.data.response[0]?.league?.standings || [];

    return leagueData;
  } catch (error) {
    console.error(
      `[League Page] Failed to fetch data for league ${leagueId}:`,
      error
    );
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string[]; locale: string };
}): Promise<Metadata> {
  const { slug, locale } = params;
  const t = await getI18n(locale);
  const leagueId = getLeagueIdFromSlug(slug[0]);
  if (!leagueId) return { title: t("not_found_title") };

  const leagueData = await getLeaguePageData(leagueId);
  if (!leagueData) return { title: t("not_found_title") };

  const { league, country } = leagueData;
  const pagePath = `/football/league/${slug.join("/")}`;
  const hreflangAlternates = await generateHreflangTags(pagePath, locale);

  return {
    title: t("league_page_title", {
      leagueName: league.name,
      countryName: country.name,
    }),
    description: t("league_page_description", {
      leagueName: league.name,
      countryName: country.name,
    }),
    alternates: hreflangAlternates,
  };
}

export default async function LeaguePage({
  params,
}: {
  params: { slug: string[]; locale: string };
}) {
  const { slug } = params;
  const leagueId = getLeagueIdFromSlug(slug[0]);
  if (!leagueId) notFound();

  const leagueData = await getLeaguePageData(leagueId);
  if (!leagueData) notFound();

  const { league, country, seasons } = leagueData;
  const currentSeason =
    seasons.find((s: any) => s.current === true)?.year ||
    new Date().getFullYear();

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="container mx-auto flex-1 w-full lg:grid lg:grid-cols-[288px_1fr_288px] lg:gap-8 lg:items-start p-4 lg:p-0 lg:py-6">
        <Sidebar />

        <main className="min-w-0 space-y-8">
          <LeagueHeader
            league={league}
            country={country}
            currentSeason={currentSeason}
          />

          {/* Display Standings prominently if it's a league */}
          {league.type === "League" && (
            <LeagueStandingsWidget
              standings={leagueData.standings}
              league={{
                seasons: seasons
                  .map((s: any) => s.year)
                  .sort((a: number, b: number) => b - a),
                id: league.id,
              }}
            />
          )}

          <LeagueFixturesWidget leagueId={league.id} season={currentSeason} />

          <LeagueTeamsList
            leagueId={league.id}
            season={currentSeason}
            countryName={country.name}
            countryFlag={country.flag}
          />
        </main>

        <aside className="hidden lg:block lg:col-span-1 space-y-8 min-w-0">
          <RecentNewsWidget />
          <AdSlotWidget location="homepage_right_sidebar" />
        </aside>
      </div>
    </div>
  );
}
