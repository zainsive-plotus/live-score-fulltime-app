// ===== src/app/[locale]/football/match/[...slug]/SidebarContent.tsx =====

"use client";

import dynamic from "next/dynamic";
import {
  AdSlotWidgetSkeleton,
  RecentNewsWidgetSkeleton,
} from "@/components/skeletons/WidgetSkeletons";
import { PredictionWidgetSkeleton } from "@/components/match/MatchPredictionWidget";

const LiveOddsWidget = dynamic(
  () => import("@/components/match/LiveOddsWidget"),
  { ssr: false }
);
const LinkedNewsWidget = dynamic(
  () => import("@/components/match/LinkedNewsWidget"),
  { loading: () => <RecentNewsWidgetSkeleton /> }
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
  standingsSeoDescription: string;
}

export default function SidebarContent({
  fixtureData,
  isLive,
  standingsSeoDescription,
}: SidebarContentProps) {
  const { fixture, league, teams } = fixtureData;

  return (
    <aside className="lg:col-span-1 space-y-6 lg:sticky lg:top-6 mt-8 lg:mt-0">
      {isLive && <LiveOddsWidget fixtureId={fixture.id.toString()} />}

      <LinkedNewsWidget fixtureId={fixture.id} />

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
    </aside>
  );
}
