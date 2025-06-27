// src/components/LeagueStandingsSlide.tsx
"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import Image from "next/image";
import { League } from "@/types/api-football";

// Type definitions...
type StandingsData = {
  league: { id: number; name: string; logo: string; };
  standings: TeamStanding[];
};
type TeamStanding = {
  rank: number;
  team: { id: number; name: string; logo: string };
  points: number;
  all: { played: number };
};

const fetchStandingsForLeague = async (leagueId: number): Promise<StandingsData | null> => {
  try {
    const { data } = await axios.get(`/api/standings?league=${leagueId}`);
    // If the API returns a valid response but no standings, treat it as null
    if (!data || !data.standings || data.standings.length === 0) {
        return null;
    }
    return data;
  } catch (error) {
    console.error(`Failed to fetch standings for league ${leagueId}:`, error);
    return null; // Return null on API error as well
  }
};

// Skeleton loader...
const SlideSkeleton = () => (
    <div className="bg-brand-secondary rounded-xl p-4 lg:p-6 animate-pulse">
        <div className="h-7 w-3/4 rounded bg-gray-600/50 mb-4"></div>
        <div className="space-y-3 mt-4">
            {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-5 w-full rounded bg-gray-600/50"></div>)}
        </div>
    </div>
);

export default function LeagueStandingsSlide({ league }: { league: League }) {
  const { data, isLoading } = useQuery<StandingsData | null>({
    queryKey: ['standings', league.id],
    queryFn: () => fetchStandingsForLeague(league.id),
    staleTime: 1000 * 60 * 10, // Cache for 10 minutes
  });

  if (isLoading) return <SlideSkeleton />;
  
  // --- THIS IS THE FIX ---
  // If data is null (either from an API error or because there are no standings),
  // render nothing. This prevents a blank slide from being created.
  if (!data) {
    return null;
  }

  const topStandings = data.standings.slice(0, 5);

  return (
    <div className="bg-brand-secondary rounded-xl p-4 lg:p-6 h-full">
      <div className="flex items-center gap-3 mb-4">
        <Image src={data.league.logo} alt={data.league.name} width={32} height={32}/>
        <h3 className="text-xl font-bold text-brand-light truncate">{data.league.name}</h3>
      </div>
      {/* The standings table */}
      <table className="w-full text-sm">
        <thead className="text-brand-muted text-xs">
          <tr className="border-b border-gray-700/50">
            <th className="p-2 font-semibold text-left w-8">#</th>
            <th className="p-2 font-semibold text-left">Team</th>
            <th className="p-2 font-semibold text-center">P</th>
            <th className="p-2 font-semibold text-center">Pts</th>
          </tr>
        </thead>
        <tbody>
          {topStandings.map((team: TeamStanding) => (
            <tr key={team.team.id} className="border-t border-gray-700/50">
              <td className="p-2 text-center">{team.rank}</td>
              <td className="p-2 flex items-center gap-2 font-medium truncate">
                <Image src={team.team.logo} alt={team.team.name} width={16} height={16} />
                {team.team.name}
              </td>
              <td className="p-2 text-center text-brand-muted">{team.all.played}</td>
              <td className="p-2 text-center font-bold text-brand-light">{team.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}