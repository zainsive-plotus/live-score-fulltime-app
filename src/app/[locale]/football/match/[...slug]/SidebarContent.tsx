// ===== src/app/[locale]/football/match/[...slug]/SidebarContent.tsx =====

"use client";

import dynamic from "next/dynamic";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import {
  AdSlotWidgetSkeleton,
  RecentNewsWidgetSkeleton,
} from "@/components/skeletons/WidgetSkeletons";
import MatchPredictionWidget from "@/components/match/MatchPredictionWidget";

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
const AdSlotWidget = dynamic(() => import("@/components/AdSlotWidget"), {
  loading: () => <AdSlotWidgetSkeleton />,
  ssr: false,
});

const fetchPredictionData = async (fixtureId: string) => {
  const { data } = await axios.get(
    `/api/match-prediction?fixtureId=${fixtureId}`
  );
  return data;
};

interface SidebarContentProps {
  fixtureData: any;
  isLive: boolean;
  linkedNews: any[];
  // REMOVED: highlights prop is no longer needed
  standingsSeoDescription: string;
}

export default function SidebarContent({
  fixtureData,
  isLive,
  linkedNews,
  standingsSeoDescription,
}: SidebarContentProps) {
  const { fixture, league, teams } = fixtureData;

  const { data: predictionData, isLoading: isLoadingPrediction } = useQuery({
    queryKey: ["predictionData", fixture.id.toString()],
    queryFn: () => fetchPredictionData(fixture.id.toString()),
    staleTime: 1000 * 60 * 5,
    enabled: !!fixture.id,
  });

  return (
    <aside className="lg:col-span-1 space-y-6 lg:sticky lg:top-6 mt-8 lg:mt-0">
      {isLive && <LiveOddsWidget fixtureId={fixture.id.toString()} />}
      <LinkedNewsWidget posts={linkedNews} />
      {/* UPDATED: Pass parameters instead of data */}
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
      <MatchPredictionWidget
        predictionData={predictionData}
        isLoading={isLoadingPrediction}
      />
      <AdSlotWidget location="match_sidebar" />
    </aside>
  );
}
