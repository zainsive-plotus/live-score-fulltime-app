// ===== src/app/[locale]/football/league/[...slug]/page.tsx =====

import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Script from "next/script";
import { WithContext, SportsEvent, BreadcrumbList } from "schema-dts";
import { format } from "date-fns";

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
import { getLeaguesStaticData } from "@/lib/data/league-static";
import { getLeaguePageData } from "@/lib/data/league";
import { generateStandingsSlug } from "@/lib/generate-standings-slug";

const BASE_URL =
  process.env.NEXT_PUBLIC_PUBLIC_APP_URL || "http://localhost:3000";

// Revalidate the page data periodically to keep it fresh
export const revalidate = 3600; // 1 hour

const getLeagueIdFromSlug = (slug: string): string | null => {
  if (!slug) return null;
  const parts = slug.split("-");
  const lastPart = parts[parts.length - 1];
  return /^\d+$/.test(lastPart) ? lastPart : null;
};

// Generates metadata using the fast, pre-built static JSON file
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

// The main page component, now using a hybrid data fetching strategy
export default async function LeaguePage({
  params,
}: {
  params: { slug: string[]; locale: string };
}) {
  const { slug, locale } = params;
  const t = await getI18n(locale);
  const leagueId = getLeagueIdFromSlug(slug[0]);
  if (!leagueId) notFound();

  // 1. Fetch basic info from the fast static file
  const allLeagues = await getLeaguesStaticData();
  const staticLeagueInfo = allLeagues.find((l) => l.id.toString() === leagueId);
  if (!staticLeagueInfo) notFound();

  // 2. Fetch the complete, dynamic data for the page body
  const dynamicLeagueData = await getLeaguePageData(leagueId);
  if (!dynamicLeagueData) notFound();

  const { league, country, seasons, standings, topScorer, leagueStats } =
    dynamicLeagueData;

  const currentSeason =
    seasons.find((s: any) => s.current === true) || seasons[0];
  const currentSeasonYear = currentSeason.year;
  const standingsSlug = generateStandingsSlug(league.name, league.id);

  // --- Prepare SEO and JSON-LD data ---
  const seoWidgetTitle = t("league_seo_widget_title", {
    leagueName: league.name,
  });
  const clubExamples =
    standings?.[0]?.slice(0, 3).map((t: any) => t.team.name) || [];
  const seoWidgetText = `
    <p>${t("league_seo_widget_about_text", {
      leagueName: league.name,
      country: country.name,
      clubCount: standings?.[0]?.length || "many",
      clubExample1: clubExamples[0] || "top clubs",
      clubExample2: clubExamples[1] || "",
      clubExample3: clubExamples[2] || "",
      startMonth: format(new Date(currentSeason.start), "MMMM"),
      endMonth: format(new Date(currentSeason.end), "MMMM"),
    })}</p>
  `;

  const jsonLd: WithContext<SportsEvent | BreadcrumbList>[] = [
    {
      "@context": "https://schema.org",
      "@type": "SportsEvent",
      name: `${league.name} ${currentSeasonYear}/${currentSeasonYear + 1}`,
      sport: "Soccer",
      location: { "@type": "Country", name: country.name },
      description: t("league_page_description", {
        leagueName: league.name,
        countryName: country.name,
      }),
      startDate: seasons.find((s: any) => s.year === currentSeasonYear)?.start,
      endDate: seasons.find((s: any) => s.year === currentSeasonYear)?.end,
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
        { "@type": "ListItem", position: 3, name: league.name },
      ],
    },
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

            {league.type === "League" && (
              <LeagueStandingsWidget
                initialStandings={standings}
                leagueSeasons={seasons
                  .map((s: any) => s.year)
                  .sort((a: number, b: number) => b - a)}
                currentSeason={currentSeasonYear}
                isLoading={false} // Data is pre-fetched on the server
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
              title={seoWidgetTitle}
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
