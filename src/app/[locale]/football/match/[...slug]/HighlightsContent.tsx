// ===== src/app/[locale]/football/match/[...slug]/HighlightsContent.tsx =====
import "server-only";
import MatchHighlightsWidget from "@/components/match/MatchHighlightsWidget";
import { getMatchHighlights } from "@/lib/data/highlightly";
import { getFixture } from "@/lib/data/match";

// The Asynchronous Server Component that fetches data
export async function HighlightsContent({ fixtureId }: { fixtureId: string }) {
  // This call is automatically deduplicated by React.cache, so it's instant.
  const fixtureResponse = await getFixture(fixtureId);
  if (!fixtureResponse || fixtureResponse.length === 0) {
    return null; // Don't render if fixture data is missing
  }

  const { league, teams } = fixtureResponse[0];

  const highlightlyParams = {
    leagueName: league.name,
    homeTeamName: teams.home.name,
    awayTeamName: teams.away.name,
    limit: 10,
  };

  const highlightsData = await getMatchHighlights(highlightlyParams);
  const highlights = highlightsData?.data ?? [];

  // Render the client widget with the fetched data
  return <MatchHighlightsWidget initialHighlights={highlights} />;
}

// The Skeleton Loader for this component
export const HighlightsSkeleton = () => (
  <div className="animate-pulse">
    <div className="h-8 w-1/2 bg-gray-700 rounded mb-4"></div>
    <div className="aspect-video w-full rounded-lg bg-gray-700/50"></div>
  </div>
);
