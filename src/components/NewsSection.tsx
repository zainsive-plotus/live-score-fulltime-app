"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { IPost } from "@/models/Post";
import StyledLink from "./StyledLink";
import { ArrowRight, Newspaper, Info } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation"; // <-- 1. Import the hook
import SidebarNewsItemWithImage, {
  SidebarNewsItemWithImageSkeleton,
} from "./SidebarNewsItemWithImage";

const fetchNews = async (
  limit: number = 5,
  locale: string
): Promise<IPost[]> => {
  // 2. Add locale to the function and the API call
  const { data } = await axios.get(
    `/api/posts?status=published&limit=${limit}&language=${locale}`
  );
  return data;
};

export default function NewsSection() {
  const { t, locale } = useTranslation(); // <-- 3. Get the current locale

  const {
    data: news,
    isLoading,
    isError,
  } = useQuery<IPost[]>({
    // 4. Add locale to the queryKey to ensure refetching on language change
    queryKey: ["newsArticlesSidebarWidget", locale],
    queryFn: () => fetchNews(5, locale!),
    staleTime: 1000 * 60 * 10,
    enabled: !!locale, // Ensure the query only runs when locale is available
  });

  return (
    <section className="bg-brand-secondary rounded-lg shadow-lg">
      <div className="flex justify-between items-center p-4 border-b border-gray-700/50">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <Newspaper size={20} className="text-brand-purple" />
          {t("latest_news")}
        </h3>
        <StyledLink
          href="/news" // General news link
          className="flex items-center gap-1 text-xs font-semibold text-text-muted transition-colors hover:text-white"
        >
          {t("see_all")}
          <ArrowRight size={14} />
        </StyledLink>
      </div>

      <div className="p-2 space-y-1">
        {isLoading ? (
          <>
            <SidebarNewsItemWithImageSkeleton />
            <SidebarNewsItemWithImageSkeleton />
            <SidebarNewsItemWithImageSkeleton />
            <SidebarNewsItemWithImageSkeleton />
            <SidebarNewsItemWithImageSkeleton />
          </>
        ) : isError ? (
          <div className="rounded-lg p-6 text-center text-red-400">
            <p>{t("error_loading_news")}</p>
          </div>
        ) : news && news.length > 0 ? (
          news.map((post) => (
            <SidebarNewsItemWithImage key={post._id as string} post={post} />
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
