// ===== src/app/[locale]/football/match/[...slug]/SidebarContent.tsx =====
"use client";

import dynamic from "next/dynamic";
import {
  AdSlotWidgetSkeleton,
  RecentNewsWidgetSkeleton,
} from "@/components/skeletons/WidgetSkeletons";

// Dynamically import client components
const LiveOddsWidget = dynamic(
  () => import("@/components/match/LiveOddsWidget"),
  { ssr: false }
);
const LinkedNewsWidget = dynamic(
  () => import("@/components/match/LinkedNewsWidget"),
  { loading: () => <RecentNewsWidgetSkeleton /> }
);
const MatchHighlightsWidget = dynamic(
  () => import("@/components/match/MatchHighlightsWidget"),
  {
    loading: () => (
      <div className="aspect-video w-full rounded-lg bg-gray-700/50 animate-pulse"></div>
    ),
  }
);
const TeamStandingsWidget = dynamic(
  () => import("@/components/match/TeamStandingsWidget")
);
const MatchPredictionWidget = dynamic(
  () => import("@/components/match/MatchPredictionWidget")
);
const AdSlotWidget = dynamic(() => import("@/components/AdSlotWidget"), {
  loading: () => <AdSlotWidgetSkeleton />,
  ssr: false,
});

interface SidebarContentProps {
  fixture: any;
  isLive: boolean;
  predictionData: any;
  bookmakerOdds: any;
  standingsSeoDescription: string;
}

export default function SidebarContent({
  fixture,
  isLive,
  predictionData,
  bookmakerOdds,
  standingsSeoDescription,
}: SidebarContentProps) {
  const { league, teams, fixture: fixtureDetails } = fixture;

  return (
    <aside className="lg:col-span-1 space-y-6 lg:sticky lg:top-6 mt-8 lg:mt-0">
      {isLive && <LiveOddsWidget fixtureId={fixtureDetails.id.toString()} />}
      <LinkedNewsWidget fixtureId={fixtureDetails.id} />
      <MatchHighlightsWidget fixtureId={fixtureDetails.id.toString()} />
      <TeamStandingsWidget
        leagueId={league.id}
        season={league.season}
        homeTeamId={teams.home.id}
        awayTeamId={teams.away.id}
        standingsSeoDescription={standingsSeoDescription}
      />
      <MatchPredictionWidget
        apiPrediction={null}
        customPrediction={predictionData?.prediction}
        bookmakerOdds={bookmakerOdds?.[0]?.bookmakers ?? []}
        teams={teams}
      />
      <AdSlotWidget location="match_sidebar" />
    </aside>
  );
}
