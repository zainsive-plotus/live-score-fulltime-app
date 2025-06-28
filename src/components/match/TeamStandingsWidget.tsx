// src/components/match/TeamStandingsWidget.tsx
"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import Image from "next/image";
import { proxyImageUrl } from "@/lib/image-proxy";
import StyledLink from "@/components/StyledLink";
import { generateTeamSlug } from "@/lib/generate-team-slug";
import { Trophy } from "lucide-react"; // Icon for widget header

interface TeamStandingsWidgetProps {
  leagueId: number;
  season: number;
  homeTeamId: number;
  awayTeamId: number;
}

// --- Helper for Conditional Coloring ---
// This function determines the Tailwind CSS class for a table row based on rank description
// AND whether the row corresponds to one of the current match's teams.
const getRankIndicatorClass = (
  description: string | null,
  isHighlighted: boolean
): string => {
  // Base background class for the row
  let baseClass = "";
  if (isHighlighted) {
    // If it's the home or away team, apply a distinct highlight background color
    baseClass = "bg-[#eb581c50]";
  } else {
    // For other teams, use a slightly darker background for better readability
    baseClass = "bg-gray-800/20";
  }

  // Apply conditional left border based on rank description (promotion/relegation, etc.)
  if (!description) return baseClass;
  const desc = description.toLowerCase();
  if (desc.includes("champions league") || desc.includes("promotion"))
    return `${baseClass} border-l-4 border-green-500`;
  if (desc.includes("europa league") || desc.includes("qualification"))
    return `${baseClass} border-l-4 border-orange-500`;
  if (desc.includes("conference league") || desc.includes("play-off"))
    return `${baseClass} border-l-4 border-sky-400`;
  if (desc.includes("relegation"))
    return `${baseClass} border-l-4 border-red-600`;

  return baseClass; // Fallback if no specific rank description matches
};

// --- Fetcher for standings data ---
const fetchStandings = async (leagueId: number, season: number) => {
  const { data } = await axios.get(
    `/api/standings?league=${leagueId}&season=${season}`
  );
  return data;
};

// --- Skeleton Component ---
const StandingsWidgetSkeleton = () => (
  <div className="bg-brand-secondary p-4 rounded-lg animate-pulse">
    <div className="h-5 w-3/4 mb-4 bg-gray-700 rounded"></div>
    <div className="space-y-3 pt-2">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="w-6 h-6 rounded-full bg-gray-700"></div>
          <div className="h-4 w-3/4 bg-gray-600 rounded"></div>
        </div>
      ))}
    </div>
  </div>
);

export default function TeamStandingsWidget({
  leagueId,
  season,
  homeTeamId,
  awayTeamId,
}: TeamStandingsWidgetProps) {
  const {
    data: standingsResponse,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["teamMatchStandings", leagueId, season],
    queryFn: () => fetchStandings(leagueId, season),
    staleTime: 1000 * 60 * 60, // Cache for 1 hour
    enabled: !!leagueId && !!season, // Only enable fetching if leagueId and season are available
  });

  if (isLoading) return <StandingsWidgetSkeleton />;

  // Extract and filter valid standings groups to prevent rendering errors
  const standings =
    standingsResponse?.standings?.[0]?.filter(
      (item: any) => item && item.team
    ) || [];

  if (
    isError ||
    !standingsResponse ||
    !standingsResponse.league ||
    standings.length === 0
  ) {
    return (
      <div className="bg-brand-secondary p-4 rounded-lg text-center">
        <p className="text-sm text-brand-muted">
          Standings not available for this league.
        </p>
      </div>
    );
  }

  // Find the exact positions of the home and away teams in the standings (for contextual display)
  const homeTeamStanding = standings.find((s: any) => s.team.id === homeTeamId);
  const awayTeamStanding = standings.find((s: any) => s.team.id === awayTeamId);

  // Determine a range of teams to show around the current teams for context.
  // We aim to show a few teams above and below the involved teams.
  let startIndex = 0;
  let endIndex = standings.length;
  if (homeTeamStanding && awayTeamStanding) {
    const minRank = Math.min(homeTeamStanding.rank, awayTeamStanding.rank);
    const maxRank = Math.max(homeTeamStanding.rank, awayTeamStanding.rank);

    startIndex = Math.max(0, minRank - 3); // Start 3 ranks above the lowest-ranked team involved
    endIndex = Math.min(standings.length, maxRank + 2); // End 2 ranks below the highest-ranked team involved
  }

  // Slice the standings to display only the relevant portion
  const displayedStandings = standings.slice(startIndex, endIndex);

  return (
    <div className="bg-brand-secondary p-4 rounded-lg">
      <h3 className="flex items-center gap-2 text-lg font-bold text-white mb-4">
        <Trophy size={20} className="text-brand-purple" />
        League Standings
      </h3>

      <div className="overflow-x-auto max-h-96 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-600">
        <table className="w-full text-sm">
          <thead className="text-left text-brand-muted sticky top-0 bg-brand-secondary z-10">
            <tr className="text-xs uppercase">
              <th className="p-2">#</th>
              <th className="p-2">Team</th>
              <th className="p-2 text-center">P</th>
              <th className="p-2 text-center">Pts</th>
            </tr>
          </thead>
          <tbody className="text-brand-light">
            {displayedStandings.map((item: any) => {
              const isHomeOrAwayTeam =
                item.team.id === homeTeamId || item.team.id === awayTeamId;
              const rowClasses = getRankIndicatorClass(
                item.description,
                isHomeOrAwayTeam
              );

              return (
                <tr key={item.team.id} className={rowClasses}>
                  <td className="p-2 text-center font-medium">{item.rank}</td>
                  <td className="p-2">
                    <StyledLink
                      href={generateTeamSlug(item.team.name, item.team.id)}
                      className="flex items-center gap-2 group"
                    >
                      <Image
                        src={proxyImageUrl(item.team.logo)}
                        alt={item.team.name}
                        width={20}
                        height={20}
                      />
                      <span className="font-semibold text-xs group-hover:text-brand-purple transition-colors truncate">
                        {item.team.name}
                      </span>
                    </StyledLink>
                  </td>
                  <td className="p-2 text-center">{item.all.played}</td>
                  <td className="p-2 text-center font-bold text-white">
                    {item.points}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
