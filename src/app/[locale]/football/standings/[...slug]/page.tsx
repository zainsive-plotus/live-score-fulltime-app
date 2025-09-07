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
import StandingsPageClient from "./StandingsPageClient";
import Script from "next/script";
import { WithContext, SportsEvent, BreadcrumbList } from "schema-dts";
import LeagueStandingsSeoWidget from "@/components/league-detail-view/LeagueStandingsSeoWidget";
import { ISeoOverride } from "@/models/SeoOverride";
import { format } from "date-fns";

const BASE_URL =
  process.env.NEXT_PUBLIC_PUBLIC_APP_URL || "http://localhost:3000";

const getLeagueIdFromSlug = (slug: string): string | null => {
  if (!slug) return null;
  const parts = slug.split("-");
  const lastPart = parts[parts.length - 1];
  return /^\d+$/.test(lastPart) ? lastPart : null;
};

async function getSeoOverride(
  leagueId: string,
  language: string
): Promise<ISeoOverride | null> {
  try {
    const { data } = await axios.get(
      `${BASE_URL}/api/seo-content/overrides?entityType=league-standings&entityId=${leagueId}&language=${language}`
    );

    return data;
  } catch (error) {
    return null;
  }
}

async function getInitialStandingsData(leagueId: string, season: string) {
  try {
    const { data } = await axios.get(
      `${BASE_URL}/api/standings?league=${leagueId}&season=${season}`
    );
    return data;
  } catch (error) {
    return null;
  }
}

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

  const season =
    (searchParams?.season as string) || new Date().getFullYear().toString();

  const [initialData, seoOverride] = await Promise.all([
    getInitialStandingsData(leagueId, season),
    getSeoOverride(leagueId, locale),
  ]);

  if (!initialData || !initialData.league) {
    return { title: t("not_found_title") };
  }

  const { league } = initialData;
  const hreflangAlternates = await generateHreflangTags(
    "/football/standings",
    slug.join("/"),
    locale
  );

  const pageTitle =
    seoOverride?.metaTitle ||
    t("standings_detail_page_title", {
      leagueName: league.name,
      season: league.season,
    });
  const pageDescription =
    seoOverride?.metaDescription ||
    t("standings_detail_page_description", {
      leagueName: league.name,
    });

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

  const season =
    (searchParams?.season as string) || new Date().getFullYear().toString();

  const [initialData, seoOverride] = await Promise.all([
    getInitialStandingsData(leagueId, season),
    getSeoOverride(leagueId, locale),
  ]);

  if (!initialData || !initialData.league) {
    notFound();
  }

  const { league, standings, leagueStats, topScorer } = initialData;

  const generateDefaultSeoText = () => {
    const currentSeasonInfo = league.seasons?.find(
      (s: number) => s === league.season
    )
      ? { start: `${league.season}-08-01`, end: `${league.season + 1}-05-31` }
      : { start: `${league.season}-08-01`, end: `${league.season + 1}-05-31` };

    const clubExamples =
      standings?.[0]?.slice(0, 3).map((t: any) => t.team.name) || [];

    return `
        <h3>${t("league_seo_fallback_about_title", {
          leagueName: league.name,
        })}</h3>
        <p>${t("league_seo_fallback_about_text", {
          leagueName: league.name,
          country: league.country,
          clubCount: standings?.[0]?.length || "many",
          clubExample1: clubExamples[0] || "top clubs",
          clubExample2: clubExamples[1] || "",
          clubExample3: clubExamples[2] || "",
          startMonth: format(new Date(currentSeasonInfo.start), "MMMM"),
          endMonth: format(new Date(currentSeasonInfo.end), "MMMM"),
        })}</p>
        <h3>${t("league_seo_fallback_format_title")}</h3>
        <p>${t("league_seo_fallback_format_text", {
          leagueName: league.name,
          clubCount: standings?.[0]?.length || "numerous",
        })}</p>
        <h3>${t("league_seo_fallback_scorers_title")}</h3>
        <p>${t("league_seo_fallback_scorers_text", {
          season: league.season,
          topScorerName: topScorer?.player?.name || "leading strikers",
          topScorerTeam: topScorer?.statistics[0]?.team?.name || "",
          topScorerGoals: topScorer?.statistics[0]?.goals?.total || "many",
        })}</p>
        <h3>${t("league_seo_fallback_champions_title")}</h3>
        <p>${t("league_seo_fallback_champions_text", {
          championTeam: standings?.[0]?.[0]?.team?.name || "The top team",
          previousSeason: league.season - 1,
          leagueName: league.name,
        })}</p>
        <h3>${t("league_seo_fallback_rank_title")}</h3>
        <p>${t("league_seo_fallback_rank_text", {
          country: league.country,
          leagueName: league.name,
          season: league.season,
          avgGoals: leagueStats?.avgGoals || "numerous",
        })}</p>
        <h3>${t("league_seo_fallback_timeline_title")}</h3>
        <p>${t("league_seo_fallback_timeline_text", {
          startMonth: format(new Date(currentSeasonInfo.start), "MMMM"),
          endMonth: format(new Date(currentSeasonInfo.end), "MMMM"),
          leagueName: league.name,
        })}</p>
        <h3>${t("league_seo_fallback_why_title")}</h3>
        <p>${t("league_seo_fallback_why_text")}</p>
      `;
  };

  const finalSeoText =
    seoOverride?.seoText && seoOverride?.seoText.length
      ? seoOverride?.seoText
      : generateDefaultSeoText();

  // --- NEW: Define pageDescription here to be used in both meta tags and JSON-LD ---
  const pageDescription =
    seoOverride?.metaDescription && seoOverride?.metaDescription.length
      ? seoOverride?.metaDescription
      : t("standings_detail_page_description", {
          leagueName: league.name,
        });

  const currentSeasonData = initialData.league.seasons?.find(
    (s: number) => s === initialData.league.season
  )
    ? {
        start: `${initialData.league.season}-08-01`,
        end: `${initialData.league.season + 1}-05-31`,
      } // A sensible fallback
    : { start: null, end: null };

  const jsonLd: WithContext<SportsEvent | BreadcrumbList>[] = [
    {
      "@context": "https://schema.org",
      "@type": "SportsEvent",
      name: `${league.name} ${league.season}`,
      sport: "Soccer",
      location: { "@type": "Country", name: league.country },
      // ADDED: Start and End Dates for the season
      startDate: currentSeasonData.start!,
      endDate: currentSeasonData.end!,
      // ADDED: Image of the league
      image: league.logo,
      competitor:
        standings?.[0]?.map((teamStanding: any) => ({
          "@type": "SportsTeam",
          name: teamStanding.team.name,
        })) || [],
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
        { "@type": "ListItem", position: 3, name: league.name },
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
              initialData={initialData}
              leagueId={leagueId}
            />
            {finalSeoText && (
              <LeagueStandingsSeoWidget
                locale={locale}
                leagueId={league.id}
                leagueName={league.name}
                season={league.season}
                seoText={finalSeoText}
              />
            )}
          </div>

          <aside className="hidden lg:block lg:col-span-1 space-y-8 min-w-0">
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
    </>
  );
}
