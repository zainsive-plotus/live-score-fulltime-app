// ===== src/app/[locale]/football/standings/[...slug]/page.tsx =====

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Script from "next/script";
import { WithContext, SportsEvent, BreadcrumbList } from "schema-dts";
import { format } from "date-fns";

import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import AdSlotWidget from "@/components/AdSlotWidget";
import RecentNewsWidget from "@/components/RecentNewsWidget";
import LeagueDetailWidget from "@/components/directory/LeagueDetailWidget";
import LeagueStandingsSeoWidget from "@/components/league-detail-view/LeagueStandingsSeoWidget";
import StandingsPageClient from "./StandingsPageClient";

import { getI18n } from "@/lib/i18n/server";
import { generateHreflangTags } from "@/lib/hreflang";
import { getLeaguesStaticData } from "@/lib/data/league-static";
import { getSeoOverride } from "@/lib/data/seo";
import { getInitialStandingsData } from "@/lib/data/standings";

const BASE_URL =
  process.env.NEXT_PUBLIC_PUBLIC_APP_URL || "http://localhost:3000";

const getLeagueIdFromSlug = (slug: string): string | null => {
  if (!slug) return null;
  const parts = slug.split("-");
  const lastPart = parts[parts.length - 1];
  return /^\d+$/.test(lastPart) ? lastPart : null;
};

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: { slug: string[]; locale: string };
  searchParams: { [key: string]: string | string[] | undefined };
}): Promise<Metadata> {
  const { slug, locale } = params;
  const t = await getI18n(locale);
  const leagueId = getLeagueIdFromSlug(slug[0]);

  if (!leagueId) {
    return { title: t("not_found_title") };
  }

  const allLeagues = await getLeaguesStaticData();
  const leagueInfo = allLeagues.find((l) => l.id.toString() === leagueId);

  if (!leagueInfo) {
    return { title: t("not_found_title") };
  }

  const season =
    (searchParams?.season as string) || new Date().getFullYear().toString();
  const seoOverride = await getSeoOverride(
    "league-standings",
    leagueId,
    locale
  );
  const hreflangAlternates = await generateHreflangTags(
    "/football/standings",
    slug.join("/"),
    locale
  );

  const pageTitle =
    seoOverride?.metaTitle ||
    t("standings_detail_page_title", {
      leagueName: leagueInfo.name,
      season: season,
    });
  const pageDescription =
    seoOverride?.metaDescription ||
    t("standings_detail_page_description", { leagueName: leagueInfo.name });

  return {
    title: pageTitle,
    description: pageDescription,
    alternates: hreflangAlternates,
  };
}

export default async function LeagueStandingsPage({
  params,
  searchParams,
}: {
  params: { slug: string[]; locale: string };
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const { slug, locale } = params;
  const t = await getI18n(locale);
  const leagueId = getLeagueIdFromSlug(slug[0]);

  if (!leagueId) {
    notFound();
  }

  const allLeagues = await getLeaguesStaticData();
  const leagueInfo = allLeagues.find((l) => l.id.toString() === leagueId);

  if (!leagueInfo) {
    notFound();
  }

  const season =
    (searchParams?.season as string) || new Date().getFullYear().toString();

  const [initialStandingsData, seoOverride] = await Promise.all([
    getInitialStandingsData(leagueId, season),
    getSeoOverride("league-standings", leagueId, locale),
  ]);

  // --- FIX: Safely destructure dynamic data with a fallback empty object ---
  const {
    standings,
    leagueStats,
    topScorer,
    league: dynamicLeague,
  } = initialStandingsData || {};

  const generateDefaultSeoText = () => {
    const currentSeasonInfo = {
      start: `${season}-08-01`,
      end: `${parseInt(season) + 1}-05-31`,
    };
    const clubExamples =
      standings?.[0]?.slice(0, 3).map((t: any) => t.team.name) || [];

    return `
          <h3>${t("league_seo_fallback_about_title", {
            leagueName: leagueInfo.name,
          })}</h3>
          <p>${t("league_seo_fallback_about_text", {
            leagueName: leagueInfo.name,
            country: leagueInfo.countryName,
            clubCount: standings?.[0]?.length || "many",
            clubExample1: clubExamples[0] || "top clubs",
            clubExample2: clubExamples[1] || "",
            clubExample3: clubExamples[2] || "",
            startMonth: format(new Date(currentSeasonInfo.start), "MMMM"),
            endMonth: format(new Date(currentSeasonInfo.end), "MMMM"),
          })}</p>
          <h3>${t("league_seo_fallback_format_title")}</h3>
          <p>${t("league_seo_fallback_format_text", {
            leagueName: leagueInfo.name,
            clubCount: standings?.[0]?.length || "numerous",
          })}</p>
          <h3>${t("league_seo_fallback_scorers_title")}</h3>
          <p>${t("league_seo_fallback_scorers_text", {
            season: season,
            topScorerName: topScorer?.player?.name || "leading strikers",
            topScorerTeam: topScorer?.statistics[0]?.team?.name || "",
            topScorerGoals: topScorer?.statistics[0]?.goals?.total || "many",
          })}</p>
      `;
  };

  const finalSeoText = seoOverride?.seoText || generateDefaultSeoText();
  const pageDescription =
    seoOverride?.metaDescription ||
    t("standings_detail_page_description", { leagueName: leagueInfo.name });

  const jsonLd: WithContext<SportsEvent | BreadcrumbList>[] = [
    {
      "@context": "https://schema.org",
      "@type": "SportsEvent",
      name: `${leagueInfo.name} ${season}`,
      sport: "Soccer",
      location: { "@type": "Country", name: leagueInfo.countryName },
      description: pageDescription,
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
          name: t("standings_hub_title"),
          item: `${BASE_URL}/${locale}/football/standings`,
        },
        { "@type": "ListItem", position: 3, name: leagueInfo.name },
      ],
    },
  ];

  return (
    <>
      <Script
        id="standings-detail-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="container mx-auto flex-1 w-full lg:grid lg:grid-cols-[288px_1fr_288px] lg:gap-8 lg:items-start p-4 lg:p-0 lg:py-6">
          <Sidebar />
          <div>
            <StandingsPageClient
              staticLeagueInfo={leagueInfo}
              initialSeason={season}
            />
            <LeagueStandingsSeoWidget
              locale={locale}
              leagueId={leagueInfo.id}
              leagueName={leagueInfo.name}
              season={parseInt(season)}
              seoText={finalSeoText}
            />
          </div>
          <aside className="hidden lg:block lg:col-span-1 space-y-8 min-w-0">
            {/* --- FIX: Conditionally render the widget only if data exists --- */}
            {dynamicLeague && (
              <LeagueDetailWidget
                league={dynamicLeague}
                leagueStats={leagueStats}
                topScorer={topScorer}
              />
            )}
            <RecentNewsWidget />
            <AdSlotWidget location="homepage_right_sidebar" />
          </aside>
        </div>
      </div>
    </>
  );
}
