// ===== src/components/match/TeamStandingsWidget.tsx =====

"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Trophy } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import TeamStandingsTable from "./TeamStandingsTable";

interface TeamStandingsWidgetProps {
  standingsResponse: any; // The full response from the /api/standings endpoint
  homeTeamId: number;
  awayTeamId: number;
  standingsSeoDescription: string;
}

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
  standingsResponse,
  homeTeamId,
  awayTeamId,
  standingsSeoDescription,
}: TeamStandingsWidgetProps) {
  const { t } = useTranslation();

  const relevantStandings = useMemo(() => {
    if (!standingsResponse || !standingsResponse.standings) return [];

    const allStandings = standingsResponse.standings.flat();
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
  }, [standingsResponse, homeTeamId, awayTeamId]);

  // Use the league data directly from the response
  const league = standingsResponse?.league;

  if (!league || relevantStandings.length === 0) {
    return null; // Don't render if there's no league data or relevant teams
  }

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
