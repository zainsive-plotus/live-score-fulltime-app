// This file path seems incorrect for a page component.
// Based on our previous discussions, this should be at:
// src/app/[locale]/football/match/[...slug]/page.tsx
// I am providing the code for that file.

// ===== src/app/[locale]/football/match/[...slug]/page.tsx =====

import { Suspense } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { headers } from "next/headers";
import Script from "next/script";
import {
  WithContext,
  SportsEvent,
  BreadcrumbList,
  EventStatusType,
} from "schema-dts";

import { getI18n } from "@/lib/i18n/server";
import { generateHreflangTags } from "@/lib/hreflang";
import {
  getFixture,
  getH2H,
  getStandings,
  getStatistics,
} from "@/lib/data/match";
import { RequestContext } from "@/lib/logging";
import { generateLeagueSlug } from "@/lib/generate-league-slug";

import Header from "@/components/Header";
import MatchDetailView from "@/components/match/MatchDetailView";
import SidebarContent from "./SidebarContent";
import {
  AdSlotWidgetSkeleton,
  RecentNewsWidgetSkeleton,
} from "@/components/skeletons/WidgetSkeletons";
import { generateDynamicMeta } from "@/lib/meta-generator";
import { DEFAULT_LOCALE } from "@/lib/i18n/config";

export const revalidate = 604800; // 7 days in seconds

const BASE_URL =
  process.env.NEXT_PUBLIC_PUBLIC_APP_URL || "http://localhost:3000";

const getFixtureIdFromSlug = (slug: string): string | null => {
  if (!slug) return null;
  const parts = slug?.split("-");
  const lastPart = parts[parts.length - 1];
  return /^\d+$/.test(lastPart) ? lastPart : null;
};

const parseMatchSlugForMeta = (
  slug: string
): { id: string; homeTeam: string; awayTeam: string } | null => {
  if (!slug) return null;

  const id = getFixtureIdFromSlug(slug);
  if (!id) return null;

  // Example slug: manchester-united-vs-arsenal-12345
  const slugWithoutId = slug.substring(0, slug.lastIndexOf(`-${id}`));
  const teams = slugWithoutId.split("-vs-");

  if (teams.length !== 2) return null;

  const formatName = (nameSlug: string) =>
    nameSlug.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());

  return {
    id,
    homeTeam: formatName(teams[0]),
    awayTeam: formatName(teams[1]),
  };
};

export async function generateMetadata({
  params,
}: {
  params: { slug: string[]; locale: string };
}): Promise<Metadata> {
  if (!params.slug || !Array.isArray(params.slug) || params.slug.length === 0) {
    return { title: "Not Found", robots: { index: false } };
  }

  const { slug, locale } = params;
  const t = await getI18n(locale);

  const matchInfo = parseMatchSlugForMeta(slug[0]);

  // const hreflangAlternates = await generateHreflangTags(
  //   "/football/match",
  //   slug.join("/"),
  //   locale
  // );

  const path = `/football/match/${slug.join("/")}`;
  const canonicalUrl =
    locale === DEFAULT_LOCALE
      ? `${BASE_URL}${path}`
      : `${BASE_URL}/${locale}${path}`;

  if (!matchInfo) {
    return {
      title: t("not_found_title"),
      alternates: { canonical: canonicalUrl },
    };
  }

  // --- REFACTORED LOGIC ---
  // Use the t() function directly for a cleaner implementation.
  const title = t("match_page_title", {
    homeTeam: matchInfo.homeTeam,
    awayTeam: matchInfo.awayTeam,
  });

  const description = t("match_page_description", {
    homeTeam: matchInfo.homeTeam,
    awayTeam: matchInfo.awayTeam,
  });

  return {
    title,
    description,
    alternates: { canonical: canonicalUrl },
  };
}

const SidebarSkeleton = () => (
  <div className="space-y-6">
    <RecentNewsWidgetSkeleton />
    <div className="aspect-video w-full rounded-lg bg-gray-700/50 animate-pulse"></div>
    <div className="bg-brand-secondary rounded-lg h-80 animate-pulse"></div>
    <AdSlotWidgetSkeleton />
  </div>
);

export default async function MatchDetailPage({
  params,
}: {
  params: { slug: string[]; locale: string };
}) {
  const { slug, locale } = params;
  const t = await getI18n(locale);
  const fixtureId = getFixtureIdFromSlug(slug[0]);
  if (!fixtureId) notFound();

  const headersList = headers();
  const pageContext: RequestContext = {
    source: "server",
    pagePath: `/football/match/${slug[0]}`,
    callerName: "MatchDetailPage",
    ip: (await headersList).get("x-forwarded-for") ?? "unknown",
    userAgent: (await headersList).get("user-agent") ?? "unknown",
    geo: {
      city: (await headersList).get("x-vercel-ip-city") ?? undefined,
      country: (await headersList).get("x-vercel-ip-country") ?? undefined,
      region:
        (await headersList).get("x-vercel-ip-country-region") ?? undefined,
    },
  };

  const fixtureData = await getFixture(fixtureId, pageContext);
  if (!fixtureData) notFound();

  const { teams, fixture: fixtureDetails, league } = fixtureData;

  const canFetchH2H = teams?.home?.id && teams?.away?.id;
  const [statistics, standingsResponse, h2h] = await Promise.all([
    getStatistics(fixtureId, pageContext),
    getStandings(league.id, league.season, pageContext),
    canFetchH2H
      ? getH2H(teams.home.id, teams.away.id, pageContext)
      : Promise.resolve(null),
  ]);

  const isLive = ["1H", "HT", "2H", "ET", "P", "LIVE"].includes(
    fixtureDetails?.status?.short
  );
  const isFinished = ["FT", "AET", "PEN"].includes(
    fixtureDetails?.status?.short
  );

  const homeTeamStats = statistics?.find((s) => s.team.id === teams.home.id);
  const awayTeamStats = statistics?.find((s) => s.team.id === teams.away.id);

  const matchData = {
    fixtureData,
    statistics, // The full array for the Stats tab
    homeTeamStats, // Specific object for the home form widget
    awayTeamStats,
    standingsResponse,
    h2h,
    fixtureId,
    isLive,
    isFinished,
    seoWidgetData: {
      title: t("about_the_match_title", {
        homeTeam: teams.home.name,
        awayTeam: teams.away.name,
      }),
      seoText: t("match_page_about_seo_text", {
        homeTeam: teams.home.name,
        awayTeam: teams.away.name,
        leagueName: league.name,
      }),
    },
  };

  const pageDescription = t("match_page_description", {
    homeTeam: teams.home.name,
    awayTeam: teams.away.name,
    leagueName: league.name,
  });
  const statusMap: { [key: string]: EventStatusType } = {
    TBD: "EventScheduled",
    NS: "EventScheduled",
    "1H": "EventInProgress",
    HT: "EventInProgress",
    "2H": "EventInProgress",
    ET: "EventInProgress",
    P: "EventInProgress",
    FT: "EventCompleted",
    AET: "EventCompleted",
    PEN: "EventCompleted",
    PST: "EventPostponed",
    CANC: "EventCancelled",
  };
  const schemaEventStatus =
    statusMap[fixtureDetails.status.short] || "EventScheduled";

  const pageUrl = `${BASE_URL}/${locale}/football/match/${slug.join("/")}`;
  const jsonLd: WithContext<SportsEvent | BreadcrumbList>[] = [
    {
      "@context": "https://schema.org",
      "@type": "SportsEvent",
      name: `${teams.home.name} vs ${teams.away.name} - ${league.name}`,
      description: pageDescription,
      startDate: new Date(fixtureDetails.date).toISOString(),
      eventStatus: schemaEventStatus,
      sport: "Soccer",
      homeTeam: { "@type": "SportsTeam", name: teams.home.name },
      awayTeam: { "@type": "SportsTeam", name: teams.away.name },
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
          name: league.name,
          item: `${BASE_URL}/${locale}${generateLeagueSlug(
            league.name,
            league.id
          )}`,
        },
        {
          "@type": "ListItem",
          position: 3,
          name: `${teams.home.name} vs ${teams.away.name}`,
          item: pageUrl, // Add the URL for the current page
        },
      ],
    },
  ];

  return (
    <>
      <Script
        id="match-details-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div
        className="bg-brand-dark min-h-screen"
        suppressHydrationWarning={true}
      >
        <Header />
        <div className="container mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8 items-start">
          <main className="min-w-0 order-first">
            <MatchDetailView matchData={matchData} />
          </main>
          <aside className="space-y-6 lg:sticky lg:top-6">
            <Suspense fallback={<SidebarSkeleton />}>
              <SidebarContent fixtureData={fixtureData} isLive={isLive} />
            </Suspense>
          </aside>
        </div>
      </div>
    </>
  );
}
