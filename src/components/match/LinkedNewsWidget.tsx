// ===== src/components/match/LinkedNewsWidget.tsx =====

"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { IPost } from "@/models/Post";
import { Newspaper, Info, ArrowRight } from "lucide-react";
import SidebarNewsItem, { SidebarNewsItemSkeleton } from "../SidebarNewsItem";
import { useTranslation } from "@/hooks/useTranslation";
import Link from "next/link";

interface LinkedNewsWidgetProps {
  fixtureId: number;
}

const fetchLinkedNews = async (
  fixtureId: number,
  locale: string
): Promise<IPost[]> => {
  const params = new URLSearchParams({
    linkedFixtureId: fixtureId.toString(),
    limit: "5",
    language: locale,
  });
  const { data } = await axios.get(`/api/posts?${params.toString()}`);
  return data.posts || [];
};

export default function LinkedNewsWidget({ fixtureId }: LinkedNewsWidgetProps) {
  const { t, locale } = useTranslation();

  const {
    data: posts,
    isLoading,
    isError,
  } = useQuery<IPost[]>({
    queryKey: ["linkedNews", fixtureId, locale],
    queryFn: () => fetchLinkedNews(fixtureId, locale!),
    staleTime: 1000 * 60 * 10, // 10 minutes
    enabled: !!fixtureId && !!locale,
  });

  if (isLoading) {
    return (
      <section className="bg-brand-secondary rounded-lg shadow-lg">
        <div className="flex justify-between items-center p-4 border-b border-gray-700/50">
          <div className="h-6 w-1/2 bg-gray-700 rounded animate-pulse"></div>
        </div>
        <div className="p-2 space-y-1">
          <SidebarNewsItemSkeleton />
          <SidebarNewsItemSkeleton />
          <SidebarNewsItemSkeleton />
        </div>
      </section>
    );
  }

  if (isError || !posts || posts.length === 0) {
    return null;
  }

  return (
    <section className="bg-brand-secondary rounded-lg shadow-lg">
      <div className="flex justify-between items-center p-4 border-b border-gray-700/50">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Newspaper size={20} className="text-[var(--brand-accent)]" />
          {t("related_news")}
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
        {posts.map((post) => (
          <SidebarNewsItem
            key={post._id as string}
            post={{
              ...post,
              slug: `/${post.language}/news/${post.slug}`,
            }}
          />
        ))}
      </div>
    </section>
  );
}
