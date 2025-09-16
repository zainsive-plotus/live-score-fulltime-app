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
import { getLeagueStaticData } from "@/lib/data/league-static";
import { getSeoOverride } from "@/lib/data/seo";
import { getInitialStandingsData } from "@/lib/data/standings";
import { DEFAULT_LOCALE } from "@/lib/i18n/config";

const BASE_URL =
  process.env.NEXT_PUBLIC_PUBLIC_APP_URL || "http://localhost:3000";

const getLeagueIdFromSlug = (slug: string): string | null => {
  if (!slug) return null;
  const parts = slug.split("-");
  const lastPart = parts[parts.length - 1];
  return /^\d+$/.test(lastPart) ? lastPart : null;
};

const parseLeagueSlugForMeta = (
  slug: string
): { id: string; name: string } | null => {
  if (!slug) return null;

  const parts = slug.split("-");
  const lastPart = parts[parts.length - 1];

  if (!/^\d+$/.test(lastPart)) {
    return null;
  }

  const id = lastPart;
  const nameParts = parts.slice(0, -1);
  const name = nameParts
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  return { id, name };
};
export async function generateMetadata({
  params,
  searchParams,
}: {
  params: { slug: string[]; locale: string };
  searchParams: { [key: string]: string | string[] | undefined };
}): Promise<Metadata> {
  // Guard clause for safety
  if (!params.slug || !Array.isArray(params.slug) || params.slug.length === 0) {
    return { title: "Not Found", robots: { index: false, follow: false } };
  }

  const { slug, locale } = params;
  const t = await getI18n(locale);

  const leagueInfoFromSlug = parseLeagueSlugForMeta(slug[0]);
  const season =
    (searchParams?.season as string) || new Date().getFullYear().toString();

  // --- CONSTRUCT THE CANONICAL URL (WITH SEASON PARAM) ---
  const path = `/football/standings/${slug.join("/")}`;
  let canonicalUrl =
    locale === DEFAULT_LOCALE
      ? `${BASE_URL}${path}`
      : `${BASE_URL}/${locale}${path}`;

  // Append the season query parameter if it exists
  if (season) {
    canonicalUrl += `?season=${season}`;
  }

  // --- OPTIMIZATION ---
  // We no longer need to fetch leagueInfo or seoOverride here.
  // Metadata is generated instantly from the slug and search params.
  // const hreflangAlternates = await generateHreflangTags(
  //   "/football/standings",
  //   slug.join("/"),
  //   locale
  // );

  if (!leagueInfoFromSlug) {
    return {
      title: t("not_found_title"),
      alternates: {
        canonical: canonicalUrl,
      },
    };
  }

  const pageTitle = t("standings_detail_page_title", {
    leagueName: leagueInfoFromSlug.name,
    season: season,
  });
  const pageDescription = t("standings_detail_page_description", {
    leagueName: leagueInfoFromSlug.name,
  });

  return {
    title: pageTitle,
    description: pageDescription,
    alternates: {
      canonical: canonicalUrl,
    },
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

  const leagueInfo = await getLeagueStaticData(leagueId);

  if (!leagueInfo) {
    notFound();
  }
  const leagueName = leagueInfo.league.name;
  const countryName = leagueInfo.country.name;

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
            leagueName: leagueName,
          })}</h3>
          <p>${t("league_seo_fallback_about_text", {
            leagueName: leagueName,
            country: countryName,
            clubCount: standings?.[0]?.length || "many",
            clubExample1: clubExamples[0] || "top clubs",
            clubExample2: clubExamples[1] || "",
            clubExample3: clubExamples[2] || "",
            startMonth: format(new Date(currentSeasonInfo.start), "MMMM"),
            endMonth: format(new Date(currentSeasonInfo.end), "MMMM"),
          })}</p>
          <h3>${t("league_seo_fallback_format_title")}</h3>
          <p>${t("league_seo_fallback_format_text", {
            leagueName: leagueName,
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
    t("standings_detail_page_description", { leagueName: leagueName });

  const jsonLd: WithContext<SportsEvent | BreadcrumbList>[] = [
    {
      "@context": "https://schema.org",
      "@type": "SportsEvent",
      name: `${leagueName} ${season}`,
      sport: "Soccer",
      location: { "@type": "Country", name: countryName },
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
        { "@type": "ListItem", position: 3, name: leagueName },
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
              staticLeagueInfo={dynamicLeague}
              initialSeason={season}
            />
            <LeagueStandingsSeoWidget
              locale={locale}
              leagueId={leagueInfo.league.id}
              leagueName={leagueName}
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
