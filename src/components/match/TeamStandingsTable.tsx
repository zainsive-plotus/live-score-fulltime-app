// ===== src/components/match/TeamStandingsTable.tsx =====
"use client"; // This is now a Client Component

import Image from "next/image";
import Link from "next/link";
import { useTranslation } from "@/hooks/useTranslation";
import { generateTeamSlug } from "@/lib/generate-team-slug";

// This component only handles rendering the UI
export default function TeamStandingsTable({
  relevantStandings,
  homeTeamId,
  awayTeamId,
}: {
  relevantStandings: any[];
  homeTeamId: number;
  awayTeamId: number;
}) {
  const { t } = useTranslation();

  if (relevantStandings.length === 0) {
    return (
      <p className="text-center text-brand-muted p-4">
        {t("standings_not_available")}
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-brand-light text-sm">
        <thead className="bg-gray-800/50 text-xs text-brand-muted uppercase">
          <tr>
            <th className="p-3">#</th>
            <th className="p-3">{t("team")}</th>
            <th className="p-3 text-center">{t("matches_played_short")}</th>
            <th className="p-3 text-center">{t("goal_difference_short")}</th>
            <th className="p-3 text-center">{t("points_short")}</th>
          </tr>
        </thead>
        <tbody>
          {relevantStandings.map((teamStanding: any) => (
            <tr
              key={teamStanding.team.id}
              className={`border-t border-gray-700/50 ${
                teamStanding.team.id === homeTeamId ||
                teamStanding.team.id === awayTeamId
                  ? "bg-brand-dark font-bold"
                  : ""
              }`}
            >
              <td className="p-3">{teamStanding.rank}</td>
              <td className="p-3">
                <Link
                  href={generateTeamSlug(
                    teamStanding.team.name,
                    teamStanding.team.id
                  )}
                  className="flex items-center gap-2 group"
                >
                  <Image
                    src={teamStanding.team.logo}
                    alt={teamStanding.team.name}
                    width={20}
                    height={20}
                  />
                  <span className="group-hover:text-brand-purple">
                    {teamStanding.team.name}
                  </span>
                </Link>
              </td>
              <td className="p-3 text-center">{teamStanding.all.played}</td>
              <td className="p-3 text-center">{teamStanding.goalsDiff}</td>
              <td className="p-3 text-center">{teamStanding.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
