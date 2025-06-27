// src/components/LeagueStandingsSlide.tsx
"use client";

import Image from 'next/image';
import Link from '@/components/StyledLink'; 

interface TeamStanding {
  rank: number;
  team: { id: number; name: string; logo: string; };
  points: number;
}
interface StandingsData {
  league: { id: number; name: string; logo: string; };
  standings: TeamStanding[];
}

export default function NewsLeagueStandingsSlide({ standingsData }: { standingsData: StandingsData }) {
  const { league, standings } = standingsData;

  return (
    // The px-1 is important to prevent slides from touching edge-to-edge
    <div className="px-1"> 
      <div className="bg-brand-secondary rounded-xl p-4 h-full">
        {/* Slide Header with League Info and Link */}
            <Image src={league.logo} alt={league.name} width={32} height={32} />
            <h4 className="font-bold text-xl text-brand-light truncate group-hover:text-brand-purple transition-colors">
              {league.name}
            </h4>
        {/* Standings Table */}
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead className="text-brand-muted text-xs">
                    <tr className="border-b border-gray-700/50">
                        <th className="p-2 font-semibold text-center w-8">#</th>
                        <th className="p-2 font-semibold text-left">Team</th>
                        <th className="p-2 font-semibold text-center">Pts</th>
                    </tr>
                </thead>
                <tbody>
                    {/* Show top 5 teams */}
                    {standings.slice(0, 5).map((team) => (
                    <tr key={team.team.id} className="border-t border-gray-700/50">
                        <td className="p-2 text-center text-brand-muted">{team.rank}</td>
                        <td className="p-2 flex items-center gap-2 font-medium">
                        <Image src={team.team.logo} alt={team.team.name} width={18} height={18} />
                        <span className="truncate">{team.team.name}</span>
                        </td>
                        <td className="p-2 text-center font-bold">{team.points}</td>
                    </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
}

// Skeleton for a single slide
export const LeagueStandingsSlideSkeleton = () => (
    <div className="px-1">
        <div className="bg-brand-secondary rounded-xl p-4 animate-pulse">
            <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-gray-600/50"></div>
                <div className="h-6 w-3/4 rounded bg-gray-600/50"></div>
            </div>
            <div className="space-y-3 mt-4">
                {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="h-5 w-full rounded bg-gray-600/50"></div>
                ))}
            </div>
        </div>
    </div>
);