// ===== src/components/league-detail-view/LeagueStandingsWidget.tsx =====

"use client";

import { useState } from "react";
import Image from "next/image";
import { proxyImageUrl } from "@/lib/image-proxy";
import StyledLink from "@/components/StyledLink";
import { Info, ShieldCheck, ShieldX, Eye, EyeOff } from "lucide-react";
import { generateTeamSlug } from "@/lib/generate-team-slug";
import { useTranslation } from "@/hooks/useTranslation";

interface TeamStanding {
  rank: number;
  team: { id: number; name: string; logo: string };
  points: number;
  all: {
    played: number;
    win: number;
    draw: number;
    lose: number;
    goals: { for: number; against: number };
  };
  goalsDiff: number;
  description: string | null;
}

interface LeagueStandingsWidgetProps {
  initialStandings: TeamStanding[][];
  leagueSeasons: number[];
  currentSeason: number;
  onSeasonChange: (season: number) => void;
  isLoading: boolean;
}

const getRankIndicatorClass = (description: string | null): string => {
  if (!description) return "bg-gray-700/50 border-gray-600/50";
  const desc = description.toLowerCase();
  if (desc.includes("champions league"))
    return "bg-blue-500/20 border-blue-500";
  if (desc.includes("promotion")) return "bg-green-500/20 border-green-500";
  if (desc.includes("europa league"))
    return "bg-orange-500/20 border-orange-500";
  if (desc.includes("relegation")) return "bg-red-600/20 border-red-600";
  return "bg-gray-700/50 border-gray-600/50";
};

// ***** FIX IS HERE: Added a default prop value for leagueSeasons *****
export default function LeagueStandingsWidget({
  initialStandings,
  leagueSeasons = [], // Safely default to an empty array
  currentSeason,
  onSeasonChange,
  isLoading,
}: LeagueStandingsWidgetProps) {
  const { t } = useTranslation();
  const [isFullView, setIsFullView] = useState(false);
  const mainStandings = initialStandings?.[0] || [];

  return (
    <div className="bg-brand-secondary rounded-lg h-full flex flex-col">
      <div className="p-4 border-b border-gray-700/50 flex flex-col md:flex-row justify-between items-center gap-4">
        {/* Season Selector */}
        <div className="flex items-center gap-2">
          <label
            htmlFor="season-select"
            className="text-sm font-semibold text-brand-muted"
          >
            Season:
          </label>
          <select
            id="season-select"
            value={currentSeason}
            onChange={(e) => onSeasonChange(Number(e.target.value))}
            className="p-1.5 text-sm rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-purple"
          >
            {leagueSeasons.map((season) => (
              <option key={season} value={season}>
                {season}/{season + 1}
              </option>
            ))}
          </select>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-2 p-1 rounded-lg bg-gray-800/50">
          <button
            onClick={() => setIsFullView(false)}
            className={`px-3 py-1 text-xs font-bold rounded-md flex items-center gap-1.5 transition-colors ${
              !isFullView
                ? "bg-brand-purple text-white"
                : "text-brand-muted hover:bg-gray-700"
            }`}
          >
            <EyeOff size={14} /> Basic
          </button>
          <button
            onClick={() => setIsFullView(true)}
            className={`px-3 py-1 text-xs font-bold rounded-md flex items-center gap-1.5 transition-colors ${
              isFullView
                ? "bg-brand-purple text-white"
                : "text-brand-muted hover:bg-gray-700"
            }`}
          >
            <Eye size={14} /> Full
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex-grow flex items-center justify-center">
          <p className="text-brand-muted">Loading new season...</p>
        </div>
      ) : mainStandings.length === 0 ? (
        <div className="flex-grow flex flex-col justify-center items-center text-center p-4">
          <Info size={28} className="mx-auto text-text-muted mb-2" />
          <p className="text-text-light font-semibold text-sm">
            {t("standings_not_available")}
          </p>
        </div>
      ) : (
        <div className="flex-grow overflow-auto custom-scrollbar">
          <table className="w-full text-sm border-separate border-spacing-0">
            <thead className="text-left text-text-muted sticky top-0 bg-brand-secondary z-10">
              <tr className="text-xs uppercase">
                <th className="p-2 w-8 text-center font-semibold">
                  {t("table_header_rank_short")}
                </th>
                <th className="p-2 font-semibold">{t("table_header_team")}</th>
                <th className="p-2 text-center font-semibold">
                  {t("table_header_played_short")}
                </th>
                {isFullView && (
                  <th className="p-2 text-center font-semibold">
                    {t("wins_short")}
                  </th>
                )}
                {isFullView && (
                  <th className="p-2 text-center font-semibold">
                    {t("draws_short")}
                  </th>
                )}
                {isFullView && (
                  <th className="p-2 text-center font-semibold">
                    {t("losses_short")}
                  </th>
                )}
                <th className="p-2 text-center font-semibold">
                  {t("table_header_goaldiff_short")}
                </th>
                <th className="p-2 text-center font-bold">
                  {t("table_header_points_short")}
                </th>
              </tr>
            </thead>
            <tbody className="text-brand-light">
              {mainStandings.map((item) => (
                <tr
                  key={item.team.id}
                  className="hover:bg-[var(--color-primary)]/50 transition-colors"
                >
                  <td
                    className={`p-2 border-t border-gray-700/50 text-center border-l-4 ${getRankIndicatorClass(
                      item.description
                    )}`}
                  >
                    <span className="font-bold">{item.rank}</span>
                  </td>
                  <td className="p-2 border-t border-gray-700/50">
                    <StyledLink
                      href={generateTeamSlug(item.team.name, item.team.id)}
                      className="flex items-center gap-2 group"
                    >
                      <Image
                        src={proxyImageUrl(item.team?.logo)}
                        alt={item.team.name}
                        width={20}
                        height={20}
                      />
                      <span className="font-semibold group-hover:text-[var(--brand-accent)] transition-colors whitespace-nowrap truncate">
                        {item.team.name}
                      </span>
                    </StyledLink>
                  </td>
                  <td className="p-2 text-center text-text-muted border-t border-gray-700/50">
                    {item.all.played}
                  </td>
                  {isFullView && (
                    <td className="p-2 text-center text-green-400 border-t border-gray-700/50">
                      {item.all.win}
                    </td>
                  )}
                  {isFullView && (
                    <td className="p-2 text-center text-yellow-400 border-t border-gray-700/50">
                      {item.all.draw}
                    </td>
                  )}
                  {isFullView && (
                    <td className="p-2 text-center text-red-400 border-t border-gray-700/50">
                      {item.all.lose}
                    </td>
                  )}
                  <td className="p-2 text-center text-text-muted border-t border-gray-700/50">
                    {item.goalsDiff}
                  </td>
                  <td className="p-2 text-center font-bold text-white border-t border-gray-700/50">
                    {item.points}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
