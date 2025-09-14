"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { IPost } from "@/models/Post";
import NewsListItemCompact, {
  NewsListItemCompactSkeleton,
} from "@/components/NewsListItemCompact";
import Pagination from "@/components/Pagination";
import { Info } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

interface TeamNewsTabProps {
  teamId: number;
}

const ITEMS_PER_PAGE = 10;

const fetchTeamNews = async (teamId: number, page: number, locale: string) => {
  const params = new URLSearchParams({
    linkedTeamId: teamId.toString(),
    page: page.toString(),
    limit: ITEMS_PER_PAGE.toString(),
    language: locale,
  });
  const { data } = await axios.get(`/api/posts?${params.toString()}`);
  return data as { posts: IPost[]; pagination: { totalPages: number } };
};

export default function TeamNewsTab({ teamId }: TeamNewsTabProps) {
  const { t, locale } = useTranslation();
  const [currentPage, setCurrentPage] = useState(1);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["teamNews", teamId, currentPage, locale],
    queryFn: () => fetchTeamNews(teamId, currentPage, locale!),
    enabled: !!locale,
    keepPreviousData: true,
  });

  if (isLoading) {
    return (
      <div className="space-y-4 p-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <NewsListItemCompactSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-8 text-center text-red-400 bg-brand-secondary rounded-lg">
        <Info size={32} className="mx-auto mb-3" />
        <p className="font-semibold">{t("error_loading_news")}</p>
      </div>
    );
  }

  if (!data || data.posts.length === 0) {
    return (
      <div className="p-8 text-center text-brand-muted bg-brand-secondary rounded-lg">
        <Info size={32} className="mx-auto mb-3" />
        <p className="font-semibold">{t("no_news_for_team")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-1">
      {data.posts.map((post) => (
        <NewsListItemCompact key={post._id as string} post={post} />
      ))}
      {data.pagination.totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={data.pagination.totalPages}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  );
}
