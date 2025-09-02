// ===== src/app/[locale]/football/match/[...slug]/SidebarContent.tsx =====

"use client";

import dynamic from "next/dynamic";
import {
  AdSlotWidgetSkeleton,
  RecentNewsWidgetSkeleton,
} from "@/components/skeletons/WidgetSkeletons";
import { PredictionWidgetSkeleton } from "@/components/match/MatchPredictionWidget";
// REMOVED: MatchAboutWidget is no longer needed in the sidebar.
// import MatchAboutWidget from "@/components/match/MatchAboutWidget";

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
  // REMOVED: Props for the old widget are no longer needed.
  // aboutMatchTitle: string;
  // aboutMatchSeoText: string;
}

export default function SidebarContent({
  fixtureData,
  isLive,
}: SidebarContentProps) {
  const { fixture, league, teams } = fixtureData;

  return (
    <>
      {isLive && <LiveOddsWidget fixtureId={fixture.id.toString()} />}

      <LinkedNewsWidget fixtureId={fixture.id} />

      <MatchHighlightsWidget
        leagueName={league.name}
        homeTeamName={teams.home.name}
        awayTeamName={teams.away.name}
      />

      <MatchPredictionWidget fixtureId={fixture.id.toString()} />

      {/* REMOVED: The MatchAboutWidget has been removed from this component's render output. */}
      {/* <MatchAboutWidget title={aboutMatchTitle} seoText={aboutMatchSeoText} /> */}

      <AdSlotWidget location="match_sidebar" />
    </>
  );
}
