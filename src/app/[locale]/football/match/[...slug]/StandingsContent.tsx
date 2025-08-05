// ===== src/app/[locale]/football/match/[...slug]/StandingsContent.tsx =====
import "server-only";
import TeamStandingsWidget from "@/components/match/TeamStandingsWidget";
import { getStandings } from "@/lib/data/match";

export async function StandingsContent({
  leagueId,
  season,
  homeTeamId,
  awayTeamId,
  standingsSeoDescription,
}: {
  leagueId: number;
  season: number;
  homeTeamId: number;
  awayTeamId: number;
  standingsSeoDescription: string;
}) {
  const standingsResponse = await getStandings(leagueId, season);
  return (
    <TeamStandingsWidget
      standingsResponse={standingsResponse}
      homeTeamId={homeTeamId}
      awayTeamId={awayTeamId}
      standingsSeoDescription={standingsSeoDescription}
    />
  );
}

export const StandingsContentSkeleton = () => (
  <div className="bg-brand-secondary rounded-lg h-96 animate-pulse p-6">
    <div className="h-8 w-1/2 bg-gray-700 rounded mb-4"></div>
    <div className="h-6 w-1/3 bg-gray-700 rounded mb-6"></div>
    <div className="space-y-2">
      <div className="h-10 bg-gray-700/50 rounded-md"></div>
      <div className="h-10 bg-gray-700/50 rounded-md"></div>
      <div className="h-10 bg-gray-700/50 rounded-md"></div>
      <div className="h-10 bg-gray-700/50 rounded-md"></div>
      <div className="h-10 bg-gray-700/50 rounded-md"></div>
    </div>
  </div>
);
