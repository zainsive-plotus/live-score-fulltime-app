// ===== src/app/[locale]/football/match/[...slug]/LinkedNewsContent.tsx =====
import "server-only";
import LinkedNewsWidget from "@/components/match/LinkedNewsWidget";
import { getNews } from "@/lib/data/news";

export async function LinkedNewsContent({
  fixtureId,
  locale,
}: {
  fixtureId: number;
  locale: string;
}) {
  const { posts } = await getNews({
    linkedFixtureId: fixtureId,
    limit: 5,
    locale,
  });
  return <LinkedNewsWidget initialPosts={posts} />;
}

export const LinkedNewsSkeleton = () => (
  <div className="bg-brand-secondary rounded-lg shadow-lg animate-pulse">
    <div className="p-4 border-b border-gray-700/50">
      <div className="h-6 w-3/4 bg-gray-700 rounded"></div>
    </div>
    <div className="p-2 space-y-1">
      <div className="h-12 bg-gray-700/50 rounded-md"></div>
      <div className="h-12 bg-gray-700/50 rounded-md"></div>
    </div>
  </div>
);
