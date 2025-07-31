// ===== src/app/[locale]/football/news/NewsPageClient.tsx =====

"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { IPost } from "@/models/Post";
import { useTranslation } from "@/hooks/useTranslation";
import { Info } from "lucide-react";
import Pagination from "@/components/Pagination";
import NewsListItemCompact, {
  NewsListItemCompactSkeleton,
} from "@/components/NewsListItemCompact";

const ITEMS_PER_PAGE = 10;

// This fetcher is now specific to this component's needs.
const fetchFootballNews = async (locale: string, page: number) => {
  const params = new URLSearchParams({
    language: locale,
    page: page.toString(),
    limit: ITEMS_PER_PAGE.toString(),
    sportsCategory: "football",
    newsType: "news", // Explicitly ask for 'news' type
  });

  const { data } = await axios.get(`/api/posts?${params.toString()}`);
  return data as { posts: IPost[]; pagination: { totalPages: number } };
};

interface NewsPageClientProps {
  initialData: {
    posts: IPost[];
    pagination: { totalPages: number };
  };
}

export default function NewsPageClient({ initialData }: NewsPageClientProps) {
  const { t, locale } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentPage = Number(searchParams.get("page")) || 1;

  // useQuery handles all client-side data fetching after the initial load.
  const { data, isLoading } = useQuery({
    queryKey: ["footballNews", currentPage, locale],
    queryFn: () => fetchFootballNews(locale, currentPage),
    // The server-fetched data is used for the very first render.
    initialData: initialData,
    // This ensures that if the user navigates back to this page, the data isn't stale.
    staleTime: 1000 * 60, // 1 minute
  });

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page.toString());
    // This navigation updates the URL, which in turn triggers the useQuery to re-fetch.
    router.push(`${pathname}?${params.toString()}`);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(ITEMS_PER_PAGE)].map((_, i) => (
          <NewsListItemCompactSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (!data?.posts || data.posts.length === 0) {
    return (
      <div className="text-center py-20 bg-brand-secondary rounded-lg">
        <Info size={32} className="mx-auto text-brand-muted mb-3" />
        <p className="text-xl font-bold text-white">
          {t("no_news_found_title")}
        </p>
        <p className="text-brand-muted mt-2">
          {t("no_football_news_found_subtitle")}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {data.posts.map((post) => (
        <NewsListItemCompact key={post._id as string} post={post} />
      ))}

      {data.pagination.totalPages > 1 && (
        <div className="pt-4">
          <Pagination
            currentPage={currentPage}
            totalPages={data.pagination.totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </div>
  );
}
