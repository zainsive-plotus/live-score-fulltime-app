// ===== src/app/[locale]/football/match/[...slug]/StatsContent.tsx =====
import "server-only";
import MatchStatsWidget from "@/components/match/MatchStatsWidget";
import { getStatistics, getFixture } from "@/lib/data/match";

export async function StatsContent({ fixtureId }: { fixtureId: string }) {
  const [statistics, fixtureResponse] = await Promise.all([
    getStatistics(fixtureId),
    getFixture(fixtureId),
  ]);
  const teams = fixtureResponse?.[0]?.teams;
  return <MatchStatsWidget statistics={statistics} teams={teams} />;
}

export const StatsContentSkeleton = () => (
  <div className="bg-brand-secondary rounded-lg h-80 animate-pulse p-6">
    <div className="h-8 w-1/3 bg-gray-700 rounded mb-6"></div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <div className="h-4 w-full bg-gray-700/50 rounded"></div>
          <div className="h-2 w-full bg-gray-700 rounded-full"></div>
        </div>
      ))}
    </div>
  </div>
);
