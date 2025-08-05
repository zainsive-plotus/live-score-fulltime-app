// ===== src/components/match/TeamStandingsWidget.tsx =====
"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import axios from "axios";
import Image from "next/image";
import Link from "next/link";
import { Trophy, ChevronRight } from "lucide-react";
import { generateTeamSlug } from "@/lib/generate-team-slug";
import { useTranslation } from "@/hooks/useTranslation";
import TeamStandingsTable from "./TeamStandingsTable"; // We will still use this for the UI

interface TeamStandingsWidgetProps {
  leagueId: number;
  season: number;
  homeTeamId: number;
  awayTeamId: number;
  standingsSeoDescription: string;
}

const fetchStandings = async (leagueId: number, season: number) => {
  try {
    const { data } = await axios.get(
      `/api/standings?league=${leagueId}&season=${season}`
    );
    return data;
  } catch (error) {
    console.error(
      `[TeamStandingsWidget] Failed to fetch standings for league ${leagueId}:`,
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

export default function TeamStandingsWidget({
  leagueId,
  season,
  homeTeamId,
  awayTeamId,
  standingsSeoDescription,
}: TeamStandingsWidgetProps) {
  const { t } = useTranslation();

  const {
    data: standingsData,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["standings", leagueId, season],
    queryFn: () => fetchStandings(leagueId, season),
    staleTime: 1000 * 60 * 15, // Cache for 15 minutes
    enabled: !!leagueId && !!season,
  });

  const relevantStandings = useMemo(() => {
    if (!standingsData || !standingsData.standings) return [];
    const allStandings = standingsData.standings.flat();
    const homeTeamRank = allStandings.find(
      (s: any) => s.team.id === homeTeamId
    );
    const awayTeamRank = allStandings.find(
      (s: any) => s.team.id === awayTeamId
    );

    if (!homeTeamRank || !awayTeamRank) return [];

    const teamRanks = [homeTeamRank.rank, awayTeamRank.rank].sort(
      (a, b) => a - b
    );
    const minRank = Math.max(1, teamRanks[0] - 2);
    const maxRank = Math.min(allStandings.length, teamRanks[1] + 2);

    let filtered = allStandings.filter(
      (s: any) => s.rank >= minRank && s.rank <= maxRank
    );

    if (!filtered.some((s: any) => s.team.id === homeTeamId))
      filtered.push(homeTeamRank);
    if (!filtered.some((s: any) => s.team.id === awayTeamId))
      filtered.push(awayTeamRank);

    return Array.from(
      new Map(filtered.map((item) => [item.team.id, item])).values()
    )
      .sort((a: any, b: any) => a.rank - b.rank)
      .slice(0, 5);
  }, [standingsData, homeTeamId, awayTeamId]);

  if (isLoading) return <StandingsSkeleton />;
  if (isError || !standingsData?.league || relevantStandings.length === 0)
    return null;

  const { league } = standingsData;

  return (
    <div className="bg-brand-secondary rounded-lg shadow-lg overflow-hidden">
      <div className="p-6">
        <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
          <Trophy size={22} className="text-yellow-400" />
          {t("league_standings")}
        </h2>
        <Link
          href={league.href}
          className="block text-lg font-semibold text-brand-light hover:text-white transition-colors mb-4"
        >
          {league.name}
        </Link>
        <p className="italic text-brand-muted leading-relaxed mb-6 text-sm">
          {standingsSeoDescription}
        </p>
        <TeamStandingsTable
          relevantStandings={relevantStandings}
          homeTeamId={homeTeamId}
          awayTeamId={awayTeamId}
        />
      </div>
    </div>
  );
}
