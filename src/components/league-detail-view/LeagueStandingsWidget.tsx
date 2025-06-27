// src/components/league/LeagueStandingsWidget.tsx
"use client";

import Image from "next/image";
import { proxyImageUrl } from "@/lib/image-proxy";
import { generateTeamSlug } from "@/lib/generate-team-slug";
import StyledLink from "@/components/StyledLink";
import { Info } from "lucide-react";

// --- SELF-CONTAINED TYPE DEFINITIONS ---
interface Team {
  id: number;
  name: string;
  logo: string;
}
interface TeamStats {
  played: number;
  win: number;
  draw: number;
  lose: number;
}
interface TeamStanding {
  rank: number;
  team: Team;
  points: number;
  goalsDiff: number;
  group: string;
  description: string | null;
  all: TeamStats;
}
interface League {
  id: number;
  name: string;
  logo: string;
  href: string;
}

interface LeagueStandingsWidgetProps {
  standings: TeamStanding[][]; // The nested array of standings groups
  league: League;
}

// --- UI COLORING HELPER ---
const getRankIndicatorClass = (description: string | null): string => {
  if (!description) return "bg-gray-700 text-brand-light";
  const desc = description.toLowerCase();
  if (desc.includes("champions league") || desc.includes("promotion"))
    return "bg-green-500/20 text-green-400";
  if (desc.includes("europa league") || desc.includes("qualification"))
    return "bg-orange-500/20 text-orange-400";
  if (desc.includes("conference league") || desc.includes("play-off"))
    return "bg-sky-400/20 text-sky-300";
  if (desc.includes("relegation")) return "bg-red-600/20 text-red-500";
  return "bg-gray-700 text-brand-light";
};

export default function LeagueStandingsWidget({
  standings,
  league,
}: LeagueStandingsWidgetProps) {
  // --- START OF THE FIX ---

  // 1. Sanitize the data at the top level to remove any entirely empty groups `[]`.
  const sanitizedGroups = standings?.filter(
    (group) => group && group.length > 0
  );

  // 2. If after sanitization there are no valid groups, show a message.
  if (!sanitizedGroups || sanitizedGroups.length === 0) {
    return (
      <div className="bg-brand-secondary p-8 rounded-lg text-center">
        <Info size={32} className="mx-auto text-brand-muted mb-3" />
        <p className="text-brand-light font-semibold">
          Standings are not available for this competition.
        </p>
      </div>
    );
  }

  // --- END OF THE FIX ---

  return (
    <div className="space-y-8">
      {/* Map over the SANITIZED groups */}
      {sanitizedGroups.map((group, index) => {
        // --- SECONDARY FIX ---
        // Also filter *within* each group to remove malformed rows (the cause of the crash).
        const validGroup = group.filter((item) => item && item.team);

        // If a group becomes empty after filtering bad rows, skip rendering it.
        if (validGroup.length === 0) return null;

        return (
          <div
            key={index}
            className="bg-brand-secondary rounded-lg overflow-hidden"
          >
            {/* Show group name only if there are multiple groups */}
            {sanitizedGroups.length > 1 && (
              <h3 className="text-xl font-bold text-white p-4 bg-gray-800/50">
                {validGroup[0].group}
              </h3>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-brand-muted">
                  <tr className="text-xs uppercase">
                    <th className="p-3 w-8 text-center">#</th>
                    <th className="p-3">Team</th>
                    <th className="p-3 text-center">Played</th>
                    <th className="p-3 text-center">W</th>
                    <th className="p-3 text-center">D</th>
                    <th className="p-3 text-center">L</th>
                    <th className="p-3 text-center">GD</th>
                    <th className="p-3 text-center font-bold">Points</th>
                  </tr>
                </thead>
                <tbody className="text-brand-light">
                  {/* Map over the inner valid group */}
                  {validGroup.map((item) => (
                    <tr
                      key={item.team.id}
                      className="border-t border-gray-700/50"
                    >
                      <td className="p-3 text-center">
                        <span
                          className={`w-6 h-6 flex items-center justify-center text-xs font-bold rounded-md ${getRankIndicatorClass(
                            item.description
                          )}`}
                        >
                          {item.rank}
                        </span>
                      </td>
                      <td className="p-3">
                        <StyledLink
                          href={generateTeamSlug(item.team.name, item.team.id)}
                          className="flex items-center gap-3 group"
                        >
                          <Image
                            src={proxyImageUrl(item.team?.logo)}
                            alt={item.team.name}
                            width={24}
                            height={24}
                          />
                          <span className="font-semibold group-hover:text-brand-purple transition-colors">
                            {item.team.name}
                          </span>
                        </StyledLink>
                      </td>
                      <td className="p-3 text-center">{item.all.played}</td>
                      <td className="p-3 text-center">{item.all.win}</td>
                      <td className="p-3 text-center">{item.all.draw}</td>
                      <td className="p-3 text-center">{item.all.lose}</td>
                      <td className="p-3 text-center">{item.goalsDiff}</td>
                      <td className="p-3 text-center font-bold text-white">
                        {item.points}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}
