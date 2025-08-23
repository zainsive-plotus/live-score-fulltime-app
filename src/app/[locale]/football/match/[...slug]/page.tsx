// src/app/[locale]/football/match/[...slug]/page.tsx

import { Suspense } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getFixture, getStatistics } from "@/lib/data/match";
import { getI18n } from "@/lib/i18n/server";
import { generateHreflangTags } from "@/lib/hreflang";
import Header from "@/components/Header";
import { MatchHeader } from "@/components/match/MatchHeader";
import TeamFormWidget from "@/components/match/TeamFormWidget";
import MatchH2HWidget from "@/components/match/MatchH2HWidget";
import MatchLineupsWidget from "@/components/match/MatchFormationWidget";
import MatchStatsWidget from "@/components/match/MatchStatsWidget";
import MatchActivityWidget from "@/components/match/MatchActivityWidget";
import SidebarContent from "./SidebarContent";
import {
  AdSlotWidgetSkeleton,
  RecentNewsWidgetSkeleton,
} from "@/components/skeletons/WidgetSkeletons";
import MatchFormationWidget from "@/components/match/MatchFormationWidget";
import StandingsWidget from "@/components/StandingsWidget";
import AdSlotWidget from "@/components/AdSlotWidget";
import { generateMatchSlug } from "@/lib/generate-match-slug";
import { format, addDays } from "date-fns";
import { getFixturesByDateRange } from "@/lib/data/fixtures";
import { SUPPORTED_LOCALES } from "@/lib/i18n/config";
import redis from "@/lib/redis"; // Import Redis client

// Revalidate pages every hour to catch updates (e.g., scores, stats)
export const revalidate = 3600;

const BASE_URL =
  process.env.NEXT_PUBLIC_PUBLIC_APP_URL || "http://localhost:3000";

// // This function pre-builds pages for the next 3 days of matches.
export async function generateStaticParams() {
  try {
    const fromDate = format(new Date(), "yyyy-MM-dd");
    const toDate = format(addDays(new Date(), 2), "yyyy-MM-dd");

    console.log(
      `[generateStaticParams/Match] Fetching all matches from ${fromDate} to ${toDate}...`
    );
    const fixtures = await getFixturesByDateRange(fromDate, toDate);

    if (!fixtures || fixtures.length === 0) {
      console.warn(
        "[generateStaticParams/Match] No upcoming fixtures found to pre-build."
      );
      return [];
    }
    console.log(
      `[generateStaticParams/Match] Found ${fixtures.length} matches. Pre-hydrating cache...`
    );

    // Pre-hydrate the cache with full fixture data for each match.
    // This prevents thousands of API calls during the page rendering step.
    const pipeline = (redis as any).pipeline();
    fixtures.forEach((fixture: any) => {
      const cacheKey = `fixture:${fixture.fixture.id}`;
      // Cache for 24 hours, long enough to outlast the build.
      pipeline.set(cacheKey, JSON.stringify(fixture), "EX", 86400);
    });
    await pipeline.exec();
    console.log(
      `[generateStaticParams/Match] Redis cache pre-hydrated successfully.`
    );

    // Generate the slug parameters for Next.js
    const params = fixtures.flatMap((fixture: any) =>
      SUPPORTED_LOCALES.map((locale) => ({
        locale,
        slug: generateMatchSlug(
          fixture.teams.home,
          fixture.teams.away,
          fixture.fixture.id
        )
          .replace(`/football/match/`, "")
          .split("/"),
      }))
    );

    console.log(
      `[generateStaticParams/Match] Returning ${params.length} paths for Next.js to build.`
    );
    return params;
  } catch (error: any) {
    console.error(
      "[generateStaticParams/Match] A critical error occurred:",
      error.message
    );
    return [];
  }
}

const getFixtureIdFromSlug = (slug: string): string | null => {
  if (!slug) return null;
  const parts = slug?.split("-");
  const lastPart = parts[parts.length - 1];
  return /^\d+$/.test(lastPart) ? lastPart : null;
};

// ... (generateMetadata function remains the same)
export async function generateMetadata({
  params,
}: {
  params: { slug: string[]; locale: string };
}): Promise<Metadata> {
  const { slug, locale } = params;
  const t = await getI18n(locale);
  const fixtureId = getFixtureIdFromSlug(slug[0]);
  const hreflangAlternates = await generateHreflangTags(
    "/football/match",
    slug.join("/"),
    locale
  );

  if (!fixtureId) {
    return {
      title: t("not_found_title"),
      alternates: hreflangAlternates,
    };
  }

  const fixtureData = await getFixture(fixtureId);

  if (!fixtureData) {
    return {
      title: t("not_found_title"),
      alternates: hreflangAlternates,
      robots: { index: false, follow: false },
    };
  }

  const { teams, league } = fixtureData;
  const pageTitle = t("match_page_title", {
    homeTeam: teams.home.name,
    awayTeam: teams.away.name,
    leagueName: league.name,
  });
  const pageDescription = t("match_page_description", {
    homeTeam: teams.home.name,
    awayTeam: teams.away.name,
    leagueName: league.name,
  });

  return {
    title: pageTitle,
    description: pageDescription,
    alternates: hreflangAlternates,
  };
}

const TeamFormContentSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    <div className="bg-brand-secondary rounded-lg h-[400px] animate-pulse p-4"></div>
    <div className="bg-brand-secondary rounded-lg h-[400px] animate-pulse p-4"></div>
  </div>
);
const H2HContentSkeleton = () => (
  <div className="bg-brand-secondary rounded-lg h-[450px] animate-pulse p-6"></div>
);
const FormationSkeleton = () => (
  <div className="bg-brand-secondary rounded-lg p-4 md:p-6 animate-pulse h-[600px]"></div>
);
const StandingsWidgetSkeleton = () => (
  <div className="bg-brand-secondary rounded-lg h-96 animate-pulse p-6"></div>
);
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

  const fixtureData = await getFixture(fixtureId);
  if (!fixtureData) notFound();

  const statistics = await getStatistics(fixtureId);

  const { teams, fixture: fixtureDetails, league } = fixtureData;

  const isLive = ["1H", "HT", "2H", "ET", "BT", "P", "LIVE"].includes(
    fixtureDetails?.status?.short
  );
  const isFinished = ["FT", "AET", "PEN"].includes(
    fixtureDetails?.status?.short
  );

  const h2hSeoDescription = t("match_page_h2h_seo_text", {
    homeTeam: teams.home.name,
    awayTeam: teams.away.name,
  });
  const activitySeoDescription = t("match_page_activity_seo_text", {
    homeTeam: teams.home.name,
    awayTeam: teams.away.name,
  });
  const aboutMatchTitle = t("about_the_match_title", {
    homeTeam: teams.home.name,
    awayTeam: teams.away.name,
  });
  const aboutMatchSeoText = t("match_page_about_seo_text", {
    homeTeam: teams.home.name,
    awayTeam: teams.away.name,
    leagueName: league.name,
  });

  return (
    <>
      <title>
        {t("match_page_title", {
          homeTeam: teams.home.name,
          awayTeam: teams.away.name,
          leagueName: league.name,
        })}
      </title>
      <meta
        name="description"
        content={t("match_page_description", {
          homeTeam: teams.home.name,
          awayTeam: teams.away.name,
          leagueName: league.name,
        })}
      />

      <div className="bg-brand-dark min-h-screen">
        <Header />
        {/* CHANGE: Responsive grid layout */}
        <div className="container mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-[320px_1fr_320px] gap-8">
          {/* CHANGE: Left sidebar stacks below main on mobile, but appears first on desktop */}
          <aside className="lg:sticky lg:top-6 space-y-6 lg:order-1">
            <Suspense fallback={<StandingsWidgetSkeleton />}>
              <StandingsWidget
                leagueId={league.id}
                season={league.season}
                homeTeamId={teams.home.id}
                awayTeamId={teams.away.id}
                variant="compact"
              />
            </Suspense>
            <AdSlotWidget location="match_sidebar_left" />
          </aside>

          {/* CHANGE: Main content is always first on mobile */}
          <main className="space-y-6 min-w-0 order-first lg:order-2">
            <MatchHeader fixture={fixtureData} />

            <Suspense fallback={<TeamFormContentSkeleton />}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <TeamFormWidget
                  team={teams.home}
                  location="Home"
                  fixtureData={fixtureData}
                />
                <TeamFormWidget
                  team={teams.away}
                  location="Away"
                  fixtureData={fixtureData}
                />
              </div>
            </Suspense>

            <Suspense fallback={<FormationSkeleton />}>
              <MatchFormationWidget fixtureId={fixtureId} />
            </Suspense>

            <MatchLineupsWidget lineups={fixtureData.lineups} />

            <Suspense fallback={<H2HContentSkeleton />}>
              <MatchH2HWidget
                teams={teams}
                currentFixtureId={fixtureId}
                h2hSeoDescription={h2hSeoDescription}
              />
            </Suspense>

            {(isLive || isFinished) && (
              <MatchStatsWidget statistics={statistics || []} teams={teams} />
            )}

            <MatchActivityWidget
              fixtureId={fixtureId}
              isLive={isLive}
              homeTeamId={teams.home.id}
              activitySeoDescription={activitySeoDescription}
            />
          </main>

          {/* CHANGE: Right sidebar stacks last on mobile, but appears third on desktop */}
          <aside className="space-y-6 lg:sticky lg:top-6 lg:order-3">
            <Suspense fallback={<SidebarSkeleton />}>
              <SidebarContent
                fixtureData={fixtureData}
                isLive={isLive}
                aboutMatchTitle={aboutMatchTitle}
                aboutMatchSeoText={aboutMatchSeoText}
              />
            </Suspense>
          </aside>
        </div>
      </div>
    </>
  );
}
