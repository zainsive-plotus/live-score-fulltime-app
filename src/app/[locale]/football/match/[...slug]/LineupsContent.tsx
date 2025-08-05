// ===== src/app/[locale]/football/match/[...slug]/LineupsContent.tsx =====
import MatchLineupsWidget from "@/components/match/MatchLineupsWidget";
import { getFixture } from "@/lib/data/match";

// The Asynchronous Server Component that fetches data
export async function LineupsContent({ fixtureId }: { fixtureId: string }) {
  // This call is automatically deduplicated by React.cache, so it's instant.
  const fixtureResponse = await getFixture(fixtureId);
  const lineups = fixtureResponse?.[0]?.lineups;

  return <MatchLineupsWidget lineups={lineups} />;
}

// The Skeleton Loader for this component
export const LineupsContentSkeleton = () => (
  <div className="bg-brand-secondary rounded-lg h-[500px] animate-pulse p-6">
    <div className="h-8 w-1/3 mx-auto bg-gray-700 rounded mb-6"></div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="h-80 bg-gray-700/50 rounded-lg"></div>
      <div className="h-80 bg-gray-700/50 rounded-lg"></div>
    </div>
  </div>
);
