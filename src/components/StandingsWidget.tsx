// ===== src/components/StandingsWidget.tsx =====

"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Info } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import LeagueStandingsWidget from "@/components/league-detail-view/LeagueStandingsWidget";

interface StandingsWidgetProps {
  leagueId: number;
  season: number;
  homeTeamId?: number;
  awayTeamId?: number;
  variant?: "default" | "compact";
}

const fetchStandings = async (leagueId: number, season: number) => {
  try {
    const { data } = await axios.get(
      `/api/standings?league=${leagueId}&season=${season}`
    );
    return data;
  } catch (error) {
    console.error(
      `[StandingsWidget] Failed to fetch standings for league ${leagueId}:`,
      error
    );
    return null;
  }
};

const StandingsSkeleton = () => (
  <div className="bg-brand-secondary rounded-lg h-96 animate-pulse p-6">
    <div className="h-8 w-1/2 bg-gray-700 rounded mb-4"></div>
    <div className="h-6 w-1/3 bg-gray-700 rounded mb-6"></div>
    <div className="space-y-2">
      <div className="h-10 bg-gray-700/50 rounded-md"></div>
      <div className="h-10 bg-gray-700/50 rounded-md"></div>
      <div className="h-10 bg-gray-700/50 rounded-md"></div>
    </div>
  </div>
);

export default function StandingsWidget({
  leagueId,
  season,
  homeTeamId,
  awayTeamId,
  variant = "default",
}: StandingsWidgetProps) {
  const { t } = useTranslation();

  const {
    data: standingsData,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["standings", leagueId, season],
    queryFn: () => fetchStandings(leagueId, season),
    staleTime: 1000 * 60 * 15,
    enabled: !!leagueId && !!season,
  });

  if (isLoading) return <StandingsSkeleton />;

  if (
    isError ||
    !standingsData ||
    !standingsData.league ||
    !standingsData.standings ||
    standingsData.standings.length === 0
  ) {
    return (
      <div className="bg-brand-secondary rounded-lg p-6 text-center">
        <Info size={32} className="mx-auto text-brand-muted mb-3" />
        <p className="font-semibold text-white">
          {t("standings_not_available")}
        </p>
      </div>
    );
  }

  return (
    <LeagueStandingsWidget
      initialStandings={standingsData.standings}
      leagueSeasons={standingsData.league.seasons}
      currentSeason={standingsData.league.season}
      isLoading={isLoading}
      leagueId={leagueId}
      leagueSlug={standingsData.league.href.split("/").pop()}
      homeTeamId={homeTeamId}
      awayTeamId={awayTeamId}
      // CHANGE: Pass hideSeasonDropdown prop
      hideSeasonDropdown={true}
    />
  );
}
