// ===== src/components/NewsSection.tsx =====

"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { IPost } from "@/models/Post";
import SidebarNewsItem, { SidebarNewsItemSkeleton } from "./SidebarNewsItem";
import { ArrowRight, Newspaper, Info } from "lucide-react";
import Link from "next/link";
import { useTranslation } from "@/hooks/useTranslation";

const fetchNews = async (
  limit: number = 5,
  locale: string
): Promise<IPost[]> => {
  const { data } = await axios.get(
    `/api/posts?status=published&limit=${limit}&language=${locale}&newsType=news`
  );
  // --- Start of Fix ---
  // The API now returns an object { posts: [...] }. We need to return the 'posts' array.
  return data.posts;
  // --- End of Fix ---
};

export default function NewsSection() {
  const { t, locale } = useTranslation();

  const {
    data: news,
    isLoading,
    isError,
  } = useQuery<IPost[]>({
    queryKey: ["newsArticlesSidebarWidget", locale],
    queryFn: () => fetchNews(5, locale!),
    staleTime: 1000 * 60 * 10,
    enabled: !!locale,
  });

  return (
    <section className="bg-brand-secondary rounded-lg shadow-lg">
      <div className="flex justify-between items-center p-4 border-b border-gray-700/50">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <Newspaper size={20} className="text-brand-purple" />
          {t("latest_news")}
        </h3>
        <Link
          href="/news/category/news"
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
            <SidebarNewsItemSkeleton />
          </>
        ) : isError ? (
          <div className="rounded-lg p-6 text-center text-red-400">
            <p>{t("error_loading_news")}</p>
          </div>
        ) : news && news.length > 0 ? (
          news.map((post) => (
            <SidebarNewsItem
              key={post._id as string}
              post={{
                ...post,
                slug: `/news/${post.slug}`,
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
