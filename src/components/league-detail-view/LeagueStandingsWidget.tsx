"use client";

import Image from "next/image";
import { proxyImageUrl } from "@/lib/image-proxy";
import StyledLink from "@/components/StyledLink";
import { Info } from "lucide-react";
import { generateTeamSlug } from "@/lib/generate-team-slug";
import { useTranslation } from "@/hooks/useTranslation"; // <-- Import hook

interface TeamStanding {
  rank: number;
  team: { id: number; name: string; logo: string };
  points: number;
  all: { played: number };
  goalsDiff: number; // Added for translation
  description: string | null;
}
interface League {
  id: number;
  name: string;
  logo: string;
  href: string;
}
interface LeagueStandingsWidgetProps {
  standings: TeamStanding[][];
  league: League;
}

const getRankIndicatorClass = (description: string | null): string => {
  if (!description) return "bg-gray-700 text-text-secondary";
  const desc = description.toLowerCase();
  if (desc.includes("champions league"))
    return "bg-blue-500 text-white font-bold";
  if (desc.includes("promotion")) return "bg-green-500 text-white font-bold";
  if (desc.includes("europa league"))
    return "bg-orange-500 text-white font-bold";
  if (desc.includes("relegation")) return "bg-red-600 text-white font-bold";
  return "bg-gray-700 text-text-secondary";
};

export default function LeagueStandingsWidget({
  standings,
  league,
}: LeagueStandingsWidgetProps) {
  const { t } = useTranslation(); // <-- Use hook
  const mainStandings = standings?.[0] || [];

  if (mainStandings.length === 0) {
    return (
      <div className="bg-brand-secondary p-4 rounded-lg text-center h-full flex flex-col justify-center">
        <Info size={28} className="mx-auto text-text-muted mb-2" />
        <p className="text-text-light font-semibold text-sm">
          {t("standings_not_available")}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-brand-secondary rounded-lg h-full flex flex-col">
      <div className="p-4 border-b border-gray-700/50">
        <h3 className="text-lg font-bold text-white">
          {t("league_standings")}
        </h3>
      </div>

      <div className="flex-grow overflow-hidden">
        <div className="h-full overflow-y-auto custom-scrollbar">
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
                  <td className="p-2 text-center border-t border-gray-700/50">
                    <span
                      className={`w-6 h-6 flex items-center justify-center text-xs font-bold rounded-md ${getRankIndicatorClass(
                        item.description
                      )}`}
                    >
                      {item.rank}
                    </span>
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
      </div>
    </div>
  );
}
