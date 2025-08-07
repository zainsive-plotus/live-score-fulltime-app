// ===== src/app/[locale]/football/match/[...slug]/SidebarContent.tsx =====

"use client";

import dynamic from "next/dynamic";
import {
  AdSlotWidgetSkeleton,
  RecentNewsWidgetSkeleton,
} from "@/components/skeletons/WidgetSkeletons";
import { PredictionWidgetSkeleton } from "@/components/match/MatchPredictionWidget";

// Each of these widgets is now a self-fetching client component
const LiveOddsWidget = dynamic(
  () => import("@/components/match/LiveOddsWidget"),
  { ssr: false }
);
const LinkedNewsWidget = dynamic(
  () => import("@/components/match/LinkedNewsWidget")
);
const MatchHighlightsWidget = dynamic(
  () => import("@/components/match/MatchHighlightsWidget")
);
const TeamStandingsWidget = dynamic(
  () => import("@/components/match/TeamStandingsWidget")
);
const MatchPredictionWidget = dynamic(
  () => import("@/components/match/MatchPredictionWidget"),
  { loading: () => <PredictionWidgetSkeleton />, ssr: false }
);
const AdSlotWidget = dynamic(() => import("@/components/AdSlotWidget"), {
  loading: () => <AdSlotWidgetSkeleton />,
  ssr: false,
});

interface SidebarContentProps {
  fixtureData: any;
  isLive: boolean;
  linkedNews: any[]; // LinkedNews is fast, so we can keep passing it as a prop
  standingsSeoDescription: string;
}

export default function SidebarContent({
  fixtureData,
  isLive,
  linkedNews,
  standingsSeoDescription,
}: SidebarContentProps) {
  const { fixture, league, teams } = fixtureData;

  return (
    // This component is now just a layout wrapper for the individual widgets
    <>
      {isLive && <LiveOddsWidget fixtureId={fixture.id.toString()} />}

      {/* LinkedNews can still be a prop as it's fast */}
      <LinkedNewsWidget posts={linkedNews} />

      {/* These widgets now fetch their own data using the provided IDs/names */}
      <MatchHighlightsWidget
        leagueName={league.name}
        homeTeamName={teams.home.name}
        awayTeamName={teams.away.name}
      />
      <TeamStandingsWidget
        leagueId={league.id}
        season={league.season}
        homeTeamId={teams.home.id}
        awayTeamId={teams.away.id}
        standingsSeoDescription={standingsSeoDescription}
      />
      <MatchPredictionWidget fixtureId={fixture.id.toString()} />

      <AdSlotWidget location="match_sidebar" />
    </>
  );
}
