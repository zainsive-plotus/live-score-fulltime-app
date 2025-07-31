// ===== src/components/RecentNewsWidget.tsx =====

"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { IPost } from "@/models/Post";
import SidebarNewsItem, { SidebarNewsItemSkeleton } from "./SidebarNewsItem";
import { ArrowRight, Newspaper, Info } from "lucide-react";
import Link from "next/link";
import { useTranslation } from "@/hooks/useTranslation";

const fetchRecentNews = async (
  limit: number = 4,
  locale: string
): Promise<IPost[]> => {
  const { data } = await axios.get(
    `/api/posts?status=published&limit=${limit}&language=${locale}&newsType=recent`
  );
  // ***** FIX HERE *****
  // The API returns an object { posts: [...] }, so we need to return data.posts, not the whole data object.
  return data.posts;
};

interface RecentNewsWidgetProps {
  limit?: number;
}

export default function RecentNewsWidget({ limit = 4 }: RecentNewsWidgetProps) {
  const { t, locale } = useTranslation();

  const {
    data: recentPosts,
    isLoading,
    isError,
  } = useQuery<IPost[]>({
    queryKey: ["recentNewsWidget", limit, locale],
    queryFn: () => fetchRecentNews(limit, locale!),
    staleTime: 1000 * 60 * 5,
    enabled: !!locale,
  });

  return (
    <section className="bg-brand-secondary rounded-lg shadow-lg">
      <div className="flex justify-between items-center p-4 border-b border-gray-700/50">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Newspaper size={20} className="text-[var(--brand-accent)]" />
          {t("recent_news")}
        </h2>
        <Link
          href="/news"
          className="flex items-center gap-1 text-xs font-semibold text-text-muted transition-colors hover:text-white"
        >
          {t("see_all")}
          <ArrowRight size={14} />
        </Link>
      </div>

      <div className="p-2 space-y-1">
        {isLoading ? (
          <>
            <SidebarNewsItemSkeleton />
            <SidebarNewsItemSkeleton />
            <SidebarNewsItemSkeleton />
            <SidebarNewsItemSkeleton />
          </>
        ) : isError ? (
          <div className="rounded-lg p-6 text-center text-red-400">
            <p>{t("error_loading_news")}</p>
          </div>
        ) : recentPosts && recentPosts.length > 0 ? (
          recentPosts.map((post) => (
            <SidebarNewsItem
              key={post._id as string}
              post={{
                ...post,
                slug: `/news/${post.slug}`,
                createdAt: new Date(post.createdAt),
                updatedAt: new Date(post.updatedAt),
              }}
            />
          ))
        ) : (
          <div className="rounded-lg p-6 text-center text-text-muted">
            <Info size={28} className="mx-auto mb-2" />
            <p className="text-sm">{t("no_news_yet")}</p>
          </div>
        )}
      </div>
    </section>
  );
}
