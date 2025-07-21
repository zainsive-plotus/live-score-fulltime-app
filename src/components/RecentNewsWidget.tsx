"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { IPost } from "@/models/Post";
import SidebarNewsItem, { SidebarNewsItemSkeleton } from "./SidebarNewsItem";
import { ArrowRight, Newspaper, Info } from "lucide-react";
import Link from "next/link";
import { useTranslation } from "@/hooks/useTranslation"; // <-- 1. Import the hook

const fetchRecentNews = async (
  limit: number = 4,
  locale: string
): Promise<IPost[]> => {
  // 2. Add locale to the function and the API call
  const { data } = await axios.get(
    `/api/posts?status=published&limit=${limit}&language=${locale}`
  );
  return data;
};

interface RecentNewsWidgetProps {
  limit?: number;
}

export default function RecentNewsWidget({ limit = 4 }: RecentNewsWidgetProps) {
  const { t, locale } = useTranslation(); // <-- 3. Get the current locale

  const {
    data: recentPosts,
    isLoading,
    isError,
  } = useQuery<IPost[]>({
    // 4. Add locale to the queryKey to ensure refetching on language change
    queryKey: ["recentNewsWidget", limit, locale],
    queryFn: () => fetchRecentNews(limit, locale!),
    staleTime: 1000 * 60 * 5,
    enabled: !!locale, // Ensure the query only runs when locale is available
  });

  return (
    <section className="bg-brand-secondary rounded-lg shadow-lg">
      <div className="flex justify-between items-center p-4 border-b border-gray-700/50">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Newspaper size={20} className="text-[var(--brand-accent)]" />
          {t("latest_news")}
        </h2>
        <Link
          href="/news" // General news link
          className="text-xs font-semibold text-text-muted hover:text-white flex items-center gap-1"
        >
          {t("see_all")} <ArrowRight size={14} />
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
          <div className="text-center py-6 text-red-400">
            <p>{t("error_loading_news")}</p>
          </div>
        ) : recentPosts && recentPosts.length > 0 ? (
          recentPosts.map((post) => (
            <SidebarNewsItem key={post._id as string} post={post} />
          ))
        ) : (
          <div className="text-center py-6 text-brand-muted">
            <Info size={28} className="mx-auto mb-2" />
            <p className="text-sm">{t("no_news_yet")}</p>
          </div>
        )}
      </div>
    </section>
  );
}
