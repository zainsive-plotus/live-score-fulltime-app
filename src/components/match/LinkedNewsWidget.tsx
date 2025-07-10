// ===== src/components/match/LinkedNewsWidget.tsx =====

"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { IPost } from "@/models/Post";
import { Newspaper, Info } from "lucide-react";
import SidebarNewsItem, { SidebarNewsItemSkeleton } from "../SidebarNewsItem"; // We'll reuse this for a consistent look

interface LinkedNewsWidgetProps {
  fixtureId: number;
}

// Fetcher function to get news linked to a specific fixture
const fetchLinkedNews = async (fixtureId: number): Promise<IPost[]> => {
  const { data } = await axios.get(
    `/api/posts?status=published&linkedFixtureId=${fixtureId}`
  );
  return data;
};

export default function LinkedNewsWidget({ fixtureId }: LinkedNewsWidgetProps) {
  const {
    data: linkedPosts,
    isLoading,
    isError,
  } = useQuery<IPost[]>({
    queryKey: ["linkedNews", fixtureId],
    queryFn: () => fetchLinkedNews(fixtureId),
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    enabled: !!fixtureId,
  });

  // If there are no posts after loading, or if there's an error, don't render the widget.
  if (!isLoading && (isError || !linkedPosts || linkedPosts.length === 0)) {
    return null;
  }

  return (
    <section className="bg-brand-secondary rounded-lg shadow-lg">
      <div className="flex justify-between items-center p-4 border-b border-gray-700/50">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Newspaper size={20} className="text-[var(--brand-accent)]" />
          Related News
        </h2>
      </div>

      <div className="p-2 space-y-1">
        {isLoading ? (
          // Show skeletons while fetching data
          <>
            <SidebarNewsItemSkeleton />
            <SidebarNewsItemSkeleton />
          </>
        ) : (
          // Map over the fetched posts and render them
          linkedPosts?.map((post) => (
            <SidebarNewsItem key={post._id as string} post={post} />
          ))
        )}
      </div>
    </section>
  );
}
