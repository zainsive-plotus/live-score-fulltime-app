// ===== src/components/match/LinkedNewsWidget.tsx =====

"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { IPost } from "@/models/Post";
import { Newspaper } from "lucide-react";
import SidebarNewsItem, { SidebarNewsItemSkeleton } from "../SidebarNewsItem";
import { useTranslation } from "@/hooks/useTranslation";

interface LinkedNewsWidgetProps {
  fixtureId: number;
}

const fetchLinkedNews = async (fixtureId: number): Promise<IPost[]> => {
  const { data } = await axios.get(
    `/api/posts?status=published&linkedFixtureId=${fixtureId}&newsType=news`
  );
  // --- Start of Fix ---
  // The API now returns an object { posts: [...] }. We need to return the 'posts' array.
  return data.posts;
  // --- End of Fix ---
};

export default function LinkedNewsWidget({ fixtureId }: LinkedNewsWidgetProps) {
  const { t } = useTranslation();

  const {
    data: linkedPosts,
    isLoading,
    isError,
  } = useQuery<IPost[]>({
    queryKey: ["linkedNews", fixtureId],
    queryFn: () => fetchLinkedNews(fixtureId),
    staleTime: 1000 * 60 * 5,
    enabled: !!fixtureId,
  });

  if (!isLoading && (isError || !linkedPosts || linkedPosts.length === 0)) {
    return null;
  }

  return (
    <section className="bg-brand-secondary rounded-lg shadow-lg">
      <div className="flex justify-between items-center p-4 border-b border-gray-700/50">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Newspaper size={20} className="text-[var(--brand-accent)]" />
          {t("related_news")}
        </h2>
      </div>

      <div className="p-2 space-y-1">
        {isLoading ? (
          <>
            <SidebarNewsItemSkeleton />
            <SidebarNewsItemSkeleton />
          </>
        ) : (
          linkedPosts?.map((post) => (
            <SidebarNewsItem
              key={post._id as string}
              post={{
                ...post,
                slug: `/news/${post.slug}`,
              }}
            />
          ))
        )}
      </div>
    </section>
  );
}
