// src/components/RecentNewsWidget.tsx
"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { IPost } from "@/models/Post";
// --- UPDATED IMPORTS ---
import SidebarNewsItem, { SidebarNewsItemSkeleton } from "./SidebarNewsItem";
import { ArrowRight, Newspaper, Info } from "lucide-react";
import Link from "next/link";

// Fetcher function remains the same
const fetchRecentNews = async (limit: number = 4): Promise<IPost[]> => {
  const { data } = await axios.get(
    `/api/posts?status=published&limit=${limit}`
  );
  return data;
};

interface RecentNewsWidgetProps {
  limit?: number;
}

export default function RecentNewsWidget({ limit = 4 }: RecentNewsWidgetProps) {
  const {
    data: recentPosts,
    isLoading,
    isError,
  } = useQuery<IPost[]>({
    queryKey: ["recentNewsWidget", limit],
    queryFn: () => fetchRecentNews(limit),
    staleTime: 1000 * 60 * 5,
  });

  return (
    <section className="bg-brand-secondary rounded-lg shadow-lg">
      <div className="flex justify-between items-center p-4 border-b border-gray-700/50">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Newspaper size={20} className="text-[var(--brand-accent)]" />
          Latest News
        </h2>
        <Link
          href="/football/news"
          className="text-xs font-semibold text-text-muted hover:text-white flex items-center gap-1"
        >
          See All <ArrowRight size={14} />
        </Link>
      </div>

      {/* --- THIS IS THE FIX --- */}
      {/* The widget now renders the compact SidebarNewsItem */}
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
            <p>Could not load news.</p>
          </div>
        ) : recentPosts && recentPosts.length > 0 ? (
          recentPosts.map((post) => (
            <SidebarNewsItem key={post._id} post={post} />
          ))
        ) : (
          <div className="text-center py-6 text-brand-muted">
            <Info size={28} className="mx-auto mb-2" />
            <p className="text-sm">No recent news available.</p>
          </div>
        )}
      </div>
    </section>
  );
}
