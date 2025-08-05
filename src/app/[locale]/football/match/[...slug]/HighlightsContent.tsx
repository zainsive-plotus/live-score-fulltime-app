// ===== src/app/[locale]/football/match/[...slug]/HighlightsContent.tsx =====
import "server-only";
import MatchHighlightsWidget from "@/components/match/MatchHighlightsWidget";
import { getMatchHighlights } from "@/lib/data/highlightly";
import { getFixture } from "@/lib/data/match";

export async function HighlightsContent({ fixtureId }: { fixtureId: string }) {
  const fixtureResponse = await getFixture(fixtureId);
  if (!fixtureResponse || fixtureResponse.length === 0) return null;

  const { league, teams } = fixtureResponse[0];
  const highlightsData = await getMatchHighlights({
    leagueName: league.name,
    homeTeamName: teams.home.name,
    awayTeamName: teams.away.name,
    limit: 10,
  });

  return (
    <MatchHighlightsWidget initialHighlights={highlightsData?.data ?? []} />
  );
}

export const HighlightsSkeleton = () => (
  <div className="animate-pulse">
    <div className="h-8 w-1/2 bg-gray-700 rounded mb-4"></div>
    <div className="aspect-video w-full rounded-lg bg-gray-700/50"></div>
  </div>
);
