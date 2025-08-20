// ===== src/app/[locale]/football/league/[...slug]/page.tsx =====

import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getI18n } from "@/lib/i18n/server";
import { generateHreflangTags } from "@/lib/hreflang";
import { getLeaguePageData } from "@/lib/data/league";
import { generateStandingsSlug } from "@/lib/generate-standings-slug";

import LeagueHeader from "@/components/league-detail-view/LeagueHeader";
import LeagueStandingsWidget from "@/components/league-detail-view/LeagueStandingsWidget";
import LeagueFixturesWidget from "@/components/league-detail-view/LeagueFixturesWidget";
import LeagueTeamsList from "@/components/league-detail-view/LeagueTeamsList";
import AdSlotWidget from "@/components/AdSlotWidget";
import RecentNewsWidget from "@/components/RecentNewsWidget";
import LeagueDetailWidget from "@/components/directory/LeagueDetailWidget";

import Script from "next/script"; // ADD: Import Script
import { WithContext, SportsEvent, BreadcrumbList } from "schema-dts";

const BASE_URL =
  process.env.NEXT_PUBLIC_PUBLIC_APP_URL || "http://localhost:3000"; // ADD: Base URL

const getLeagueIdFromSlug = (slug: string): string | null => {
  if (!slug) return null;
  const parts = slug.split("-");
  const lastPart = parts[parts.length - 1];
  return /^\d+$/.test(lastPart) ? lastPart : null;
};

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
    return {
      title: t("not_found_title"),
      alternates: hreflangAlternates,
    };
  }

  const leagueData = await getLeaguePageData(leagueId);

  if (!leagueData) {
    return {
      title: t("not_found_title"),
      alternates: hreflangAlternates,
      robots: { index: false, follow: false },
    };
  }

  const { league, country } = leagueData;

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
  const { slug, locale } = params;
  const t = await getI18n(locale); //
  const leagueId = getLeagueIdFromSlug(slug[0]);
  if (!leagueId) notFound();

  const leagueData = await getLeaguePageData(leagueId);
  if (!leagueData) notFound();

  const { league, country, seasons, standings } = leagueData;
  const currentSeason =
    seasons.find((s: any) => s.current === true)?.year ||
    new Date().getFullYear();

  const standingsSlug = generateStandingsSlug(league.name, league.id);

  // ADD: Define JSON-LD schema for this page
  const jsonLd: WithContext<SportsEvent | BreadcrumbList>[] = [
    {
      "@context": "https://schema.org",
      "@type": "SportsEvent",
      name: `${league.name} ${currentSeason}/${currentSeason + 1}`,
      sport: "Soccer",
      location: {
        "@type": "Country",
        name: country.name,
      },
      competitor:
        standings?.[0]?.map((teamStanding: any) => ({
          "@type": "SportsTeam",
          name: teamStanding.team.name,
        })) || [],
      description: t("league_page_description", {
        leagueName: league.name,
        countryName: country.name,
      }),
      startDate: seasons.find((s: any) => s.year === currentSeason)?.start,
      endDate: seasons.find((s: any) => s.year === currentSeason)?.end,
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
          name: t("leagues"),
          item: `${BASE_URL}/${locale}/football/leagues`,
        },
        {
          "@type": "ListItem",
          position: 3,
          name: league.name,
        },
      ],
    },
  ];

  return (
    <>
      {/* ADD: Inject the schema into the page */}
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
            <LeagueHeader
              league={league}
              country={country}
              currentSeason={currentSeason}
            />

            {league.type === "League" && (
              <LeagueStandingsWidget
                initialStandings={leagueData.standings}
                leagueSeasons={seasons
                  .map((s: any) => s.year)
                  .sort((a: number, b: number) => b - a)}
                currentSeason={currentSeason}
                isLoading={false}
                leagueId={league.id}
                leagueSlug={standingsSlug}
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
            <LeagueDetailWidget
              league={leagueData.league}
              leagueStats={leagueData.leagueStats}
              topScorer={leagueData.topScorer}
            />
            <RecentNewsWidget />
            <AdSlotWidget location="homepage_right_sidebar" />
          </aside>
        </div>
      </div>
    </>
  );
}
