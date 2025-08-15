// ===== src/app/[locale]/football/match/[...slug]/SidebarContent.tsx =====

"use client";

import dynamic from "next/dynamic";
import {
  AdSlotWidgetSkeleton,
  RecentNewsWidgetSkeleton,
} from "@/components/skeletons/WidgetSkeletons";
import { PredictionWidgetSkeleton } from "@/components/match/MatchPredictionWidget";
import MatchAboutWidget from "@/components/match/MatchAboutWidget"; // ADD: Import the new widget

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
  aboutMatchTitle: string; // ADD: New prop for the title
  aboutMatchSeoText: string; // ADD: New prop for the SEO text
}

export default function SidebarContent({
  fixtureData,
  isLive,
  aboutMatchTitle,
  aboutMatchSeoText,
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

      {/* ADD: The new MatchAboutWidget */}
      <MatchAboutWidget title={aboutMatchTitle} seoText={aboutMatchSeoText} />

      <AdSlotWidget location="match_sidebar" />
    </>
  );
}
