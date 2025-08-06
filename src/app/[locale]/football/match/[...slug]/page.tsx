import { Suspense } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

// Import NEW granular data functions
import {
  getFixture,
  getH2H,
  getTeamStats,
  getStatistics,
  getStandings,
  getPredictionData,
  getBookmakerOdds,
  getLinkedNews,
  getMatchHighlights,
} from "@/lib/data/match";

// Standard imports
import { getI18n } from "@/lib/i18n/server";
import { generateHreflangTags } from "@/lib/hreflang";
import Header from "@/components/Header";

// Existing Component imports
import { MatchHeader } from "@/components/match/MatchHeader";
import TeamFormWidget from "@/components/match/TeamFormWidget";
import MatchH2HWidget from "@/components/match/MatchH2HWidget";
import MatchLineupsWidget from "@/components/match/MatchLineupsWidget";
import MatchStatsWidget from "@/components/match/MatchStatsWidget";
import MatchActivityWidget from "@/components/match/MatchActivityWidget";
import AdSlotWidget from "@/components/AdSlotWidget";
import LiveOddsWidget from "@/components/match/LiveOddsWidget";
import LinkedNewsWidget from "@/components/match/LinkedNewsWidget";
import MatchHighlightsWidget from "@/components/match/MatchHighlightsWidget";
import TeamStandingsWidget from "@/components/match/TeamStandingsWidget";
import MatchPredictionWidget from "@/components/match/MatchPredictionWidget";
import {
  AdSlotWidgetSkeleton,
  RecentNewsWidgetSkeleton,
} from "@/components/skeletons/WidgetSkeletons";

// --- Helper Function ---
const getFixtureIdFromSlug = (slug: string): string | null => {
  if (!slug) return null;
  const parts = slug?.split("-");
  const lastPart = parts[parts.length - 1];
  return /^\d+$/.test(lastPart) ? lastPart : null;
};

// --- Metadata ---
export async function generateMetadata({
  params,
}: {
  params: { slug: string[]; locale: string };
}): Promise<Metadata> {
  const { slug, locale } = params;
  const t = await getI18n(locale);
  const fixtureId = getFixtureIdFromSlug(slug[0]);
  if (!fixtureId) return { title: t("not_found_title") };

  const fixtureData = await getFixture(fixtureId);
  if (!fixtureData) return { title: t("not_found_title") };

  const { teams, league } = fixtureData;
  const pagePath = `/football/match/${slug.join("/")}`;
  const hreflangAlternates = await generateHreflangTags(pagePath, locale);
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

// ===== Start of Async Components and Skeletons for Streaming =====

async function TeamFormContent({ fixture }: { fixture: any }) {
  const { league, teams } = fixture;
  const [h2hData, homeTeamStats, awayTeamStats] = await Promise.all([
    getH2H(teams.home.id, teams.away.id),
    getTeamStats(league.id, league.season, teams.home.id),
    getTeamStats(league.id, league.season, teams.away.id),
  ]);
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <TeamFormWidget
        teamStats={homeTeamStats}
        team={teams.home}
        location="Home"
        h2hData={h2hData}
      />
      <TeamFormWidget
        teamStats={awayTeamStats}
        team={teams.away}
        location="Away"
        h2hData={h2hData}
      />
    </div>
  );
}
const TeamFormContentSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    <div className="bg-brand-secondary rounded-lg h-[400px] animate-pulse p-4"></div>
    <div className="bg-brand-secondary rounded-lg h-[400px] animate-pulse p-4"></div>
  </div>
);

async function LineupsContent({ fixtureId }: { fixtureId: string }) {
  const fixtureResponse = await getFixture(fixtureId);
  return <MatchLineupsWidget lineups={fixtureResponse?.lineups} />;
}
const LineupsContentSkeleton = () => (
  <div className="bg-brand-secondary rounded-lg h-[500px] animate-pulse p-6">
    <div className="h-8 w-1/3 mx-auto bg-gray-700 rounded mb-6"></div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="h-80 bg-gray-700/50 rounded-lg"></div>
      <div className="h-80 bg-gray-700/50 rounded-lg"></div>
    </div>
  </div>
);

async function H2HContent({
  fixtureId,
  h2hSeoDescription,
}: {
  fixtureId: string;
  h2hSeoDescription: string;
}) {
  const fixtureResponse = await getFixture(fixtureId);
  if (!fixtureResponse) return null;
  const { home, away } = fixtureResponse.teams;
  const h2h = await getH2H(home.id, away.id);
  return (
    <MatchH2HWidget
      h2h={h2h}
      teams={{ home, away }}
      currentFixtureId={fixtureId}
      h2hSeoDescription={h2hSeoDescription}
    />
  );
}
const H2HContentSkeleton = () => (
  <div className="bg-brand-secondary rounded-lg h-[450px] animate-pulse p-6">
    <div className="h-8 w-1/3 bg-gray-700 rounded mb-4"></div>
    <div className="h-4 w-full bg-gray-700 rounded mb-6"></div>
    <div className="grid grid-cols-3 gap-4 mb-6">
      <div className="h-24 bg-gray-700/50 rounded"></div>
      <div className="h-24 bg-gray-700/50 rounded"></div>
      <div className="h-24 bg-gray-700/50 rounded"></div>
    </div>
    <div className="space-y-3">
      <div className="h-12 bg-gray-700/50 rounded-md"></div>
      <div className="h-12 bg-gray-700/50 rounded-md"></div>
    </div>
  </div>
);

async function StatsContent({ fixtureId }: { fixtureId: string }) {
  const [statistics, fixtureResponse] = await Promise.all([
    getStatistics(fixtureId),
    getFixture(fixtureId),
  ]);
  return (
    <MatchStatsWidget statistics={statistics} teams={fixtureResponse?.teams} />
  );
}
const StatsContentSkeleton = () => (
  <div className="bg-brand-secondary rounded-lg h-80 animate-pulse p-6">
    <div className="h-8 w-1/3 bg-gray-700 rounded mb-6"></div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <div className="h-4 w-full bg-gray-700/50 rounded"></div>
          <div className="h-2 w-full bg-gray-700 rounded-full"></div>
        </div>
      ))}
    </div>
  </div>
);

async function Sidebar({
  fixtureData,
  isLive,
  locale,
}: {
  fixtureData: any;
  isLive: boolean;
  locale: string;
}) {
  const t = await getI18n(locale);
  const { fixture, teams, league } = fixtureData;

  const [
    predictionData,
    bookmakerOdds,
    standingsResponse,
    linkedPosts,
    highlights,
  ] = await Promise.all([
    getPredictionData(
      fixture.id.toString(),
      teams.home.id,
      teams.away.id,
      league.id,
      league.season
    ),
    getBookmakerOdds(fixture.id.toString()),
    getStandings(league.id, league.season),
    getLinkedNews(fixture.id, locale),
    getMatchHighlights(league.name, teams.home.name, teams.away.name),
  ]);

  const standingsSeoDescription = t("match_page_standings_seo_text", {
    homeTeam: teams.home.name,
    awayTeam: teams.away.name,
  });

  return (
    <>
      {isLive && <LiveOddsWidget fixtureId={fixture.id.toString()} />}
      <LinkedNewsWidget posts={linkedPosts} />
      <MatchHighlightsWidget highlights={highlights} />
      <TeamStandingsWidget
        standingsResponse={standingsResponse}
        homeTeamId={teams.home.id}
        awayTeamId={teams.away.id}
        standingsSeoDescription={standingsSeoDescription}
      />
      <MatchPredictionWidget
        apiPrediction={null}
        customPrediction={predictionData?.customPrediction}
        bookmakerOdds={bookmakerOdds}
        teams={teams}
      />
      <AdSlotWidget location="match_sidebar" />
    </>
  );
}

const SidebarSkeleton = () => (
  <div className="space-y-6">
    <RecentNewsWidgetSkeleton />
    <div className="aspect-video w-full rounded-lg bg-gray-700/50 animate-pulse"></div>
    <div className="bg-brand-secondary rounded-lg h-80 animate-pulse"></div>
    <AdSlotWidgetSkeleton />
  </div>
);

// ===== Main Page Component =====

export default async function MatchDetailPage({
  params,
}: {
  params: { slug: string[]; locale: string };
}) {
  const { slug, locale } = params;
  const t = await getI18n(locale);
  const fixtureId = getFixtureIdFromSlug(slug[0]);
  if (!fixtureId) notFound();

  // Initial, fast data fetch. This is all that's needed to render the shell.
  const fixtureData = await getFixture(fixtureId);
  if (!fixtureData) notFound();

  const { teams, fixture: fixtureDetails } = fixtureData;

  const isLive = ["1H", "HT", "2H", "ET", "BT", "P", "LIVE"].includes(
    fixtureDetails.status?.short
  );
  const isFinished = ["FT", "AET", "PEN"].includes(fixtureDetails.status.short);

  const h2hSeoDescription = t("match_page_h2h_seo_text", {
    homeTeam: teams.home.name,
    awayTeam: teams.away.name,
  });
  const activitySeoDescription = t("match_page_activity_seo_text", {
    homeTeam: teams.home.name,
    awayTeam: teams.away.name,
  });

  return (
    <div className="bg-brand-dark min-h-screen">
      <Header />
      <div className="container mx-auto p-4 md:p-6 lg:grid lg:grid-cols-3 lg:gap-8 lg:items-start">
        <main className="lg:col-span-2 space-y-6">
          <MatchHeader fixture={fixtureData} analytics={{}} />{" "}
          {/* Renders instantly */}
          <Suspense fallback={<TeamFormContentSkeleton />}>
            <TeamFormContent fixture={fixtureData} />
          </Suspense>
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
          <MatchActivityWidget
            fixtureId={fixtureId}
            homeTeamId={teams.home.id}
            isLive={isLive}
            activitySeoDescription={activitySeoDescription}
          />
        </main>

        <aside className="lg:col-span-1 space-y-6 lg:sticky lg:top-6 mt-8 lg:mt-0">
          <Suspense fallback={<SidebarSkeleton />}>
            <Sidebar
              fixtureData={fixtureData}
              isLive={isLive}
              locale={locale}
            />
          </Suspense>
        </aside>
      </div>
    </div>
  );
}
