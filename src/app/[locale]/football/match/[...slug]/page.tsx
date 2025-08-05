// ===== src/app/[locale]/football/match/[...slug]/page.tsx =====
import { Suspense } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

// Data fetching functions
import {
  getFixture,
  getCustomPredictionData,
  getBookmakerOdds,
} from "@/lib/data/match";

// Components
import Header from "@/components/Header";
import { MatchHeader } from "@/components/match/MatchHeader";
import MatchStatusBanner from "@/components/match/MatchStatusBanner";
import TeamFormWidget from "@/components/match/TeamFormWidget";
import AdSlotWidget from "@/components/AdSlotWidget";
import LiveOddsWidget from "@/components/match/LiveOddsWidget";
import MatchActivityWidget from "@/components/match/MatchActivityWidget";
import MatchPredictionWidget from "@/components/match/MatchPredictionWidget";

// SEO & i18n
import { getI18n } from "@/lib/i18n/server";
import { generateHreflangTags } from "@/lib/hreflang";
import { AdSlotWidgetSkeleton } from "@/components/skeletons/WidgetSkeletons";

// Wrapper Components and their Skeletons
import { H2HContent, H2HContentSkeleton } from "./H2HContent";
import { LineupsContent, LineupsContentSkeleton } from "./LineupsContent";
import { StandingsContent, StandingsContentSkeleton } from "./StandingsContent";
import { StatsContent, StatsContentSkeleton } from "./StatsContent";
import { LinkedNewsContent, LinkedNewsSkeleton } from "./LinkedNewsContent";
import { HighlightsContent, HighlightsSkeleton } from "./HighlightsContent";

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

  const fixtureResponse = await getFixture(fixtureId);
  if (!fixtureResponse || fixtureResponse.length === 0)
    return { title: t("not_found_title") };

  const fixtureData = fixtureResponse[0];
  const { home: homeTeam, away: awayTeam } = fixtureData.teams;
  const pagePath = `/football/match/${slug.join("/")}`;
  const hreflangAlternates = await generateHreflangTags(pagePath, locale);
  const pageTitle = t("match_page_title", {
    homeTeam: homeTeam.name,
    awayTeam: awayTeam.name,
    leagueName: fixtureData.league.name,
  });
  const pageDescription = t("match_page_description", {
    homeTeam: homeTeam.name,
    awayTeam: awayTeam.name,
    leagueName: fixtureData.league.name,
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

  // Fetch only the most critical data for the initial paint.
  // The rest will be fetched inside Suspense boundaries.
  const fixtureResponse = await getFixture(fixtureId);
  if (!fixtureResponse || !fixtureResponse.length) notFound();

  const fixture = fixtureResponse[0];
  const { home: homeTeam, away: awayTeam } = fixture.teams;
  const { id: homeTeamId } = homeTeam;
  const { id: awayTeamId } = awayTeam;
  const { id: leagueId, season } = fixture.league;

  const [predictionData, bookmakerOdds] = await Promise.all([
    getCustomPredictionData(fixtureId),
    getBookmakerOdds(fixtureId),
  ]);

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
              customPrediction: predictionData?.prediction,
              bookmakerOdds,
            }}
          />
          <MatchStatusBanner fixture={fixture} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <TeamFormWidget
              teamStats={predictionData?.homeTeamStats}
              team={homeTeam}
              location="Home"
              h2hData={[]}
            />
            <TeamFormWidget
              teamStats={predictionData?.awayTeamStats}
              team={awayTeam}
              location="Away"
              h2hData={[]}
            />
          </div>

          <Suspense fallback={<LineupsContentSkeleton />}>
            <LineupsContent fixtureId={fixtureId} />
          </Suspense>

          <Suspense fallback={<H2HContentSkeleton />}>
            <H2HContent
              fixtureId={fixtureId}
              h2hSeoDescription={h2hSeoDescription}
            />
          </Suspense>

          {(isLive || isFinished) && (
            <Suspense fallback={<StatsContentSkeleton />}>
              <StatsContent fixtureId={fixtureId} />
            </Suspense>
          )}

          {/* ActivityWidget is client-side but fetches its initial data inside, so it also gets a Suspense boundary */}
          <Suspense fallback={<div>Loading Activity...</div>}>
            <MatchActivityWidget
              fixtureId={fixtureId}
              homeTeamId={homeTeamId}
              isLive={isLive}
              activitySeoDescription={activitySeoDescription}
            />
          </Suspense>
        </main>

        <aside className="lg:col-span-1 space-y-6 lg:sticky lg:top-6 mt-8 lg:mt-0">
          {isLive && <LiveOddsWidget fixtureId={fixtureId} />}

          <Suspense fallback={<LinkedNewsSkeleton />}>
            <LinkedNewsContent fixtureId={Number(fixtureId)} locale={locale} />
          </Suspense>

          <Suspense fallback={<HighlightsSkeleton />}>
            <HighlightsContent fixtureId={fixtureId} />
          </Suspense>

          <Suspense fallback={<StandingsContentSkeleton />}>
            <StandingsContent
              leagueId={leagueId}
              season={season}
              homeTeamId={homeTeamId}
              awayTeamId={awayTeamId}
              standingsSeoDescription={standingsSeoDescription}
            />
          </Suspense>

          <MatchPredictionWidget
            apiPrediction={null}
            customPrediction={predictionData?.prediction}
            bookmakerOdds={bookmakerOdds?.[0]?.bookmakers ?? []}
            teams={fixture.teams}
          />
          {/* AdSlotWidget is now a client component, no Suspense needed unless you want to show a skeleton */}
          <AdSlotWidget location="match_sidebar" />
        </aside>
      </div>
    </div>
  );
}
