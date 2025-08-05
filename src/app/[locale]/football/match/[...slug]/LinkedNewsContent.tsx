// ===== src/app/[locale]/football/match/[...slug]/LinkedNewsContent.tsx =====
import LinkedNewsWidget from "@/components/match/LinkedNewsWidget";
import { getNews } from "@/lib/data/news";

// The Asynchronous Server Component that fetches data from your DB
export async function LinkedNewsContent({ fixtureId }: { fixtureId: number }) {
  // Fetch news linked to this fixture
  const { posts: linkedPosts } = await getNews({
    linkedFixtureId: fixtureId,
    limit: 5,
    locale: "tr", // Assuming you want to fetch news in a default language or pass locale down
  });

  // Render the original widget with the fetched data
  // The client component for this widget needs to be adjusted
  return <LinkedNewsWidget initialPosts={linkedPosts} />;
}

// The Skeleton Loader for this component
export const LinkedNewsSkeleton = () => (
  <div className="bg-brand-secondary rounded-lg shadow-lg animate-pulse">
    <div className="p-4 border-b border-gray-700/50">
      <div className="h-6 w-3/4 bg-gray-700 rounded"></div>
    </div>
    <div className="p-2 space-y-1">
      <SidebarNewsItemSkeleton />
      <SidebarNewsItemSkeleton />
    </div>
  </div>
);

// Helper skeleton for the sidebar news item
const SidebarNewsItemSkeleton = () => (
  <div className="flex flex-col gap-1.5 p-3">
    <div className="h-4 w-full rounded bg-gray-700"></div>
    <div className="h-3 w-1/3 rounded bg-gray-700"></div>
  </div>
);
