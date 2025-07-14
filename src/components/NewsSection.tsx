"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { IPost } from "@/models/Post";
import StyledLink from "./StyledLink";
import { ArrowRight, Newspaper, Info } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import SidebarNewsItemWithImage, {
  SidebarNewsItemWithImageSkeleton,
} from "./SidebarNewsItemWithImage";

const fetchNews = async (limit: number = 5): Promise<IPost[]> => {
  const { data } = await axios.get(
    `/api/posts?status=published&limit=${limit}`
  );
  return data;
};

export default function NewsSection() {
  const {
    data: news,
    isLoading,
    isError,
  } = useQuery<IPost[]>({
    queryKey: ["newsArticlesSidebarWidget"],
    queryFn: () => fetchNews(5),
    staleTime: 1000 * 60 * 10,
  });

  const { t } = useTranslation();

  return (
    <section className="bg-brand-secondary rounded-lg shadow-lg">
      <div className="flex justify-between items-center p-4 border-b border-gray-700/50">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <Newspaper size={20} className="text-brand-purple" />
          {t("latest_news")}
        </h3>
        <StyledLink
          href="/football/news"
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
