// ===== src/components/match/TeamStandingsWidget.tsx =====
import "server-only"; // This component now only runs on the server
import Image from "next/image";
import Link from "next/link";
import { Trophy } from "lucide-react";
import { getI18n } from "@/lib/i18n/server";
import TeamStandingsTable from "./TeamStandingsTable"; // Import the new Client Component

// This async function is now a Server Component
export default async function TeamStandingsWidget({
  standingsResponse,
  homeTeamId,
  awayTeamId,
  standingsSeoDescription,
}: {
  standingsResponse: any;
  homeTeamId: number;
  awayTeamId: number;
  standingsSeoDescription: string;
}) {
  const t = await getI18n();

  // All this logic is now correctly running on the server
  const allStandings = standingsResponse?.[0]?.league?.standings?.flat() || [];

  const homeTeamRank = allStandings.find((s: any) => s.team.id === homeTeamId);
  const awayTeamRank = allStandings.find((s: any) => s.team.id === awayTeamId);

  let relevantStandings = [];
  if (homeTeamRank && awayTeamRank) {
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

    relevantStandings = Array.from(
      new Map(filtered.map((item) => [item.team.id, item])).values()
    )
      .sort((a: any, b: any) => a.rank - b.rank)
      .slice(0, 5);
  }

  const league = standingsResponse?.[0]?.league;

  if (!league) {
    return null; // Don't render if there's no league data
  }

  return (
    <div className="bg-brand-secondary rounded-lg shadow-lg overflow-hidden">
      <div className="p-6">
        <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
          <Trophy size={22} className="text-yellow-400" />
          {t("league_standings")}
        </h2>
        <Link
          href={`/football/standings/${league.name
            .toLowerCase()
            .replace(/ /g, "-")}-${league.id}`}
          className="block text-lg font-semibold text-brand-light hover:text-white transition-colors mb-4"
        >
          {league.name}
        </Link>
        <p className="italic text-brand-muted leading-relaxed mb-6 text-sm">
          {standingsSeoDescription}
        </p>

        {/* Render the Client Component with the processed data */}
        <TeamStandingsTable
          relevantStandings={relevantStandings}
          homeTeamId={homeTeamId}
          awayTeamId={awayTeamId}
        />
      </div>
    </div>
  );
}
