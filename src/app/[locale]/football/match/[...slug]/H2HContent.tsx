// ===== src/app/[locale]/football/match/[...slug]/H2HContent.tsx =====
import "server-only";
import MatchH2HWidget from "@/components/match/MatchH2HWidget";
import { getH2H, getFixture } from "@/lib/data/match";

export async function H2HContent({
  fixtureId,
  h2hSeoDescription,
}: {
  fixtureId: string;
  h2hSeoDescription: string;
}) {
  const fixtureResponse = await getFixture(fixtureId);
  if (!fixtureResponse || fixtureResponse.length === 0) return null;

  const { home, away } = fixtureResponse[0].teams;
  const h2h = await getH2H(home.id, away.id);

  return (
    <MatchH2HWidget
      h2h={h2h}
      teams={{ home, away }}
      currentFixtureId={fixtureId}
      h2hSeoDescription={h2hSeoDescription}
    />
  );
}

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
