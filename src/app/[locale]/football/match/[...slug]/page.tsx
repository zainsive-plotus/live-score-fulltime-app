// ===== src/app/[locale]/football/match/[...slug]/page.tsx =====
import { Suspense } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { fetchMatchPageData } from "@/lib/data/match";
import { getNews } from "@/lib/data/news"; // For fetching linked news on the server
import { getMatchHighlights } from "@/lib/data/highlightly"; // For fetching highlights on the server

// --- Eagerly loaded Server Components (Above the fold) ---
import Header from "@/components/Header";
import { MatchHeader } from "@/components/match/MatchHeader";
import MatchStatusBanner from "@/components/match/MatchStatusBanner";
import TeamFormWidget from "@/components/match/TeamFormWidget";
import MatchH2HWidget from "@/components/match/MatchH2HWidget";
import MatchLineupsWidget from "@/components/match/MatchLineupsWidget";
import MatchStatsWidget from "@/components/match/MatchStatsWidget";
import TeamStandingsWidget from "@/components/match/TeamStandingsWidget";
import MatchPredictionWidget from "@/components/match/MatchPredictionWidget";

// --- Client Components for Interactivity ---
import MatchActivityWidget from "@/components/match/MatchActivityWidget";
import LiveOddsWidget from "@/components/match/LiveOddsWidget";
import AdSlotWidget from "@/components/AdSlotWidget";
import LinkedNewsWidget from "@/components/match/LinkedNewsWidget";
import MatchHighlightsWidget from "@/components/match/MatchHighlightsWidget";

// --- Skeletons for Suspense ---
import {
  AdSlotWidgetSkeleton,
  RecentNewsWidgetSkeleton,
} from "@/components/skeletons/WidgetSkeletons";

// --- SEO & i18n ---
import { getI18n } from "@/lib/i18n/server";
import { generateHreflangTags } from "@/lib/hreflang";

const getFixtureIdFromSlug = (slug: string): string | null => {
  if (!slug) return null;
  const parts = slug?.split("-");
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
  const fixtureId = getFixtureIdFromSlug(slug[0]);
  if (!fixtureId) return { title: t("not_found_title") };

  const data = await fetchMatchPageData(fixtureId);
  if (!data) return { title: t("not_found_title") };

  const { home: homeTeam, away: awayTeam } = data.fixture.teams;
  const pagePath = `/football/match/${slug.join("/")}`;
  const hreflangAlternates = await generateHreflangTags(pagePath, locale);
  const pageTitle = t("match_page_title", {
    homeTeam: homeTeam.name,
    awayTeam: awayTeam.name,
    leagueName: data.fixture.league.name,
  });
  const pageDescription = t("match_page_description", {
    homeTeam: homeTeam.name,
    awayTeam: awayTeam.name,
    leagueName: data.fixture.league.name,
  });
  return {
    title: pageTitle,
    description: pageDescription,
    alternates: hreflangAlternates,
  };
}

export default async function MatchDetailPage({
  params,
}: {
  params: { slug: string[]; locale: string };
}) {
  const { slug, locale } = params;
  const t = await getI18n(locale);
  const fixtureId = getFixtureIdFromSlug(slug[0]);
  if (!fixtureId) notFound();

  // 1. Fetch ALL data for the page in one go. It's cached.
  const data = await fetchMatchPageData(fixtureId);
  if (!data) notFound();

  const { fixture, statistics, h2h, standings, analytics } = data;
  const { home: homeTeam, away: awayTeam } = fixture.teams;

  // 2. Fetch data for sidebar widgets in parallel.
  const [linkedNewsData, highlightsData] = await Promise.all([
    getNews({ linkedFixtureId: fixture.fixture.id, limit: 5, locale }),
    getMatchHighlights({
      leagueName: fixture.league.name,
      homeTeamName: homeTeam.name,
      awayTeamName: awayTeam.name,
      limit: 10,
    }),
  ]);
  const linkedPosts = linkedNewsData.posts;
  const highlights = highlightsData?.data ?? [];

  const isLive = ["1H", "HT", "2H", "ET", "BT", "P", "LIVE"].includes(
    fixture.fixture.status?.short
  );
  const isFinished = ["FT", "AET", "PEN"].includes(
    fixture.fixture.status?.short
  );

  const h2hSeoDescription = t("match_page_h2h_seo_text", {
    homeTeam: homeTeam.name,
    awayTeam: awayTeam.name,
  });
  const standingsSeoDescription = t("match_page_standings_seo_text", {
    homeTeam: homeTeam.name,
    awayTeam: awayTeam.name,
  });
  const activitySeoDescription = t("match_page_activity_seo_text", {
    homeTeam: homeTeam.name,
    awayTeam: awayTeam.name,
  });

  return (
    <div className="bg-brand-dark min-h-screen">
      <Header />
      <div className="container mx-auto p-4 md:p-6 lg:grid lg:grid-cols-3 lg:gap-8 lg:items-start">
        <main className="lg:col-span-2 space-y-6">
          <MatchHeader
            fixture={fixture}
            analytics={{
              customPrediction: analytics.customPrediction,
              bookmakerOdds: analytics.bookmakerOdds,
            }}
          />
          <MatchStatusBanner fixture={fixture} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <TeamFormWidget
              teamStats={analytics.homeTeamStats}
              team={homeTeam}
              location="Home"
              h2hData={h2h}
            />
            <TeamFormWidget
              teamStats={analytics.awayTeamStats}
              team={awayTeam}
              location="Away"
              h2hData={h2h}
            />
          </div>
          <MatchLineupsWidget lineups={fixture.lineups} />
          <MatchH2HWidget
            h2h={h2h}
            teams={fixture.teams}
            currentFixtureId={fixtureId}
            h2hSeoDescription={h2hSeoDescription}
          />
          {(isLive || isFinished) && (
            <MatchStatsWidget statistics={statistics} teams={fixture.teams} />
          )}
          <MatchActivityWidget
            fixtureId={fixtureId}
            homeTeamId={homeTeam.id}
            isLive={isLive}
            activitySeoDescription={activitySeoDescription}
          />
        </main>

        <aside className="lg:col-span-1 space-y-6 lg:sticky lg:top-6 mt-8 lg:mt-0">
          {isLive && <LiveOddsWidget fixtureId={fixtureId} />}

          {/* Pass server-fetched data as props */}
          <LinkedNewsWidget posts={linkedPosts} />
          <MatchHighlightsWidget highlights={highlights} />

          <TeamStandingsWidget
            standingsResponse={standings}
            homeTeamId={homeTeam.id}
            awayTeamId={awayTeam.id}
            standingsSeoDescription={standingsSeoDescription}
          />

          <MatchPredictionWidget
            apiPrediction={null}
            customPrediction={analytics.customPrediction}
            bookmakerOdds={analytics.bookmakerOdds}
            teams={fixture.teams}
          />
          <AdSlotWidget location="match_sidebar" />
        </aside>
      </div>
    </div>
  );
}
