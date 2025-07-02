// src/components/match/TeamStandingsWidget.tsx
"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useMemo } from "react";
import Image from "next/image";
import { ChevronRight, Trophy } from "lucide-react";
import Link from "next/link";
import { generateLeagueSlug } from "@/lib/generate-league-slug"; // Assuming this is used
import { generateTeamSlug } from "@/lib/generate-team-slug";

// Type definitions (ensure they are comprehensive or align with your API response)
interface TeamStanding {
  rank: number;
  team: { id: number; name: string; logo: string };
  points: number;
  goalsDiff: number;
  all: { played: number; win: number; draw: number; lose: number };
  description: string | null;
  group: string; // Group name for group stage standings
}

interface LeagueInfo {
  id: number;
  name: string;
  logo: string;
  type: string;
  href: string; // The generated slug
}

interface StandingsResponse {
  league: LeagueInfo | null;
  standings: TeamStanding[][]; // Array of arrays for multiple groups/stages
}

interface TeamStandingsWidgetProps {
  leagueId: number;
  season: number;
  homeTeamId: number;
  awayTeamId: number;
  standingsSeoDescription: string; // <-- NEW PROP
}

const fetchStandings = async (
  leagueId: number,
  season: number
): Promise<StandingsResponse> => {
  const { data } = await axios.get(
    `/api/standings?league=${leagueId}&season=${season}`
  );
  return data;
};

export default function TeamStandingsWidget({
  leagueId,
  season,
  homeTeamId,
  awayTeamId,
  standingsSeoDescription, // <-- NEW PROP
}: TeamStandingsWidgetProps) {
  const {
    data: standingsData,
    isLoading,
    isError,
  } = useQuery<StandingsResponse>({
    queryKey: ["standings", leagueId, season],
    queryFn: () => fetchStandings(leagueId, season),
    enabled: !!leagueId && !!season,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  const allStandings = useMemo(() => {
    // Flatten the array of arrays into a single list of standings,
    // assuming there's only one relevant group or we want to show all.
    // In many cases, it's just standings[0] for a league.
    return standingsData?.standings ? standingsData.standings.flat() : [];
  }, [standingsData]);

  // Find the ranks of the home and away teams in the flattened standings
  const homeTeamRank = useMemo(() => {
    return allStandings.find((s) => s.team.id === homeTeamId);
  }, [allStandings, homeTeamId]);

  const awayTeamRank = useMemo(() => {
    return allStandings.find((s) => s.team.id === awayTeamId);
  }, [allStandings, awayTeamId]);

  // Display only the teams involved in the match and a few surrounding teams for context
  const relevantStandings = useMemo(() => {
    if (!homeTeamRank || !awayTeamRank) return [];

    const ranksToShow = new Set<number>();
    ranksToShow.add(homeTeamRank.rank);
    ranksToShow.add(awayTeamRank.rank);

    // Also include teams directly above/below for context, up to 5 total
    const sortedRanks = Array.from(ranksToShow).sort((a, b) => a - b);
    const minRank = Math.max(1, sortedRanks[0] - 2); // At least rank 1
    const maxRank = sortedRanks[sortedRanks.length - 1] + 2;

    const filteredAndSorted = allStandings
      .filter((s) => s.rank >= minRank && s.rank <= maxRank)
      .sort((a, b) => a.rank - b.rank)
      .slice(0, 5); // Limit to max 5 entries

    // Ensure both home and away teams are definitely in the list, even if outside the narrow range
    if (!filteredAndSorted.some((s) => s.team.id === homeTeamId)) {
      filteredAndSorted.push(homeTeamRank);
    }
    if (!filteredAndSorted.some((s) => s.team.id === awayTeamId)) {
      filteredAndSorted.push(awayTeamRank);
    }
    // Re-sort and de-duplicate after potentially adding
    return Array.from(new Set(filteredAndSorted)).sort(
      (a, b) => a.rank - b.rank
    );
  }, [homeTeamRank, awayTeamRank, allStandings, homeTeamId, awayTeamId]);

  if (isLoading)
    return (
      <div className="bg-brand-dark rounded-lg p-6 shadow-lg animate-pulse">
        <div className="h-6 w-3/4 bg-gray-700 rounded mb-4"></div>
        <div className="h-4 w-1/2 bg-gray-600 rounded mb-4"></div>
        <div className="space-y-2">
          <div className="h-8 bg-gray-700 rounded"></div>
          <div className="h-8 bg-gray-700 rounded"></div>
          <div className="h-8 bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  if (isError)
    return (
      <div className="bg-brand-dark rounded-lg p-6 text-red-400">
        Failed to load standings.
      </div>
    );
  if (!standingsData?.league)
    return (
      <div className="bg-brand-secondary rounded-lg p-6 text-brand-muted">
        No standings available for this league.
      </div>
    );

  const league = standingsData.league;

  return (
    <div className="bg-brand-secondary rounded-lg shadow-lg overflow-hidden">
      <div className="p-6">
        <h2 className="text-2xl font-bold text-white mb-4">League Standings</h2>
        <Link
          href={league.href}
          className="flex items-center gap-3 mb-6 hover:text-white transition-colors"
        >
          <Image src={league.logo} alt={league.name} width={30} height={30} />
          <span className="text-xl font-semibold">{league.name}</span>
          <ChevronRight size={20} className="text-brand-muted" />
        </Link>

        {/* --- Standings SEO Optimization Text --- */}
        <p className="italic text-[#a3a3a3] leading-relaxed mb-6 ">
          {standingsSeoDescription}
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-brand-light text-sm">
            <thead className="bg-gray-800/50 text-xs text-brand-muted uppercase">
              <tr>
                <th className="p-3">#</th>
                <th className="p-3">Takım</th>
                <th className="p-3">O</th>
                <th className="p-3">G</th>
                <th className="p-3">B</th>
                <th className="p-3">M</th>
                <th className="p-3">Av.</th>
                <th className="p-3">P</th>
              </tr>
            </thead>
            <tbody>
              {relevantStandings.map((teamStanding) => (
                <tr
                  key={teamStanding.team.id}
                  className={`border-t border-gray-700/50 ${
                    teamStanding.team.id === homeTeamId ||
                    teamStanding.team.id === awayTeamId
                      ? "bg-brand-dark font-bold" // Highlight current match teams
                      : ""
                  }`}
                >
                  <td className="p-3">{teamStanding.rank}</td>
                  <td className="p-3 flex items-center gap-2">
                    <Image
                      src={teamStanding.team.logo}
                      alt={teamStanding.team.name}
                      width={20}
                      height={20}
                      className="w-5 h-5 object-contain"
                    />
                    <Link
                      href={generateTeamSlug(
                        teamStanding.team.name,
                        teamStanding.team.id
                      )}
                      className="hover:text-white"
                    >
                      {teamStanding.team.name}
                    </Link>
                  </td>
                  <td className="p-3">{teamStanding.all.played}</td>
                  <td className="p-3">{teamStanding.all.win}</td>
                  <td className="p-3">{teamStanding.all.draw}</td>
                  <td className="p-3">{teamStanding.all.lose}</td>
                  <td className="p-3">{teamStanding.goalsDiff}</td>
                  <td className="p-3">{teamStanding.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
