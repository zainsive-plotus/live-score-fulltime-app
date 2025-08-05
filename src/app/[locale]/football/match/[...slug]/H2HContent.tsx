// ===== src/app/[locale]/football/match/[...slug]/H2HContent.tsx =====
import MatchH2HWidget from "@/components/match/MatchH2HWidget";
import { getH2H, getFixture } from "@/lib/data/match";

// The Asynchronous Server Component that fetches data
export async function H2HContent({
  fixtureId,
  homeTeamId,
  awayTeamId,
  h2hSeoDescription,
}: {
  fixtureId: string;
  homeTeamId: number;
  awayTeamId: number;
  h2hSeoDescription: string;
}) {
  // Fetch H2H and fixture data in parallel. getFixture is instant due to caching.
  const [h2h, fixtureResponse] = await Promise.all([
    getH2H(homeTeamId, awayTeamId),
    getFixture(fixtureId),
  ]);

  const teams = fixtureResponse?.[0]?.teams;

  // Render the original widget with the fetched data
  return (
    <MatchH2HWidget
      h2h={h2h}
      teams={teams}
      currentFixtureId={fixtureId}
      h2hSeoDescription={h2hSeoDescription}
    />
  );
}

// The Skeleton Loader for this component
export const H2HContentSkeleton = () => (
  <div className="bg-brand-secondary rounded-lg h-[450px] animate-pulse p-6">
    <div className="h-8 w-1/3 bg-gray-700 rounded mb-4"></div>
    <div className="h-4 w-full bg-gray-700 rounded mb-6"></div>
    <div className="grid grid-cols-3 gap-4 mb-6">
      <div className="h-24 bg-gray-700/50 rounded"></div>
      <div className="h-24 bg-gray-700/50 rounded"></div>
      <div className="h-24 bg-gray-700/50 rounded"></div>
    </div>
    <div className="space-y-3">
      <div className="h-12 bg-gray-700/50 rounded-md"></div>
      <div className="h-12 bg-gray-700/50 rounded-md"></div>
    </div>
  </div>
);
