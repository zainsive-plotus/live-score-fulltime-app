"use client";

import { useState, useMemo } from "react";
import { usePathname } from "next/navigation";
import { IPost } from "@/models/Post";
import { useTranslation } from "@/hooks/useTranslation";
import { Info } from "lucide-react";
import Pagination from "@/components/Pagination";
import NewsListItemCompact, {
  NewsListItemCompactSkeleton,
} from "@/components/NewsListItemCompact";

const ITEMS_PER_PAGE = 10; // We can show more items in this compact layout

interface NewsPageClientProps {
  initialNews: IPost[];
}

export default function NewsPageClient({ initialNews }: NewsPageClientProps) {
  const { t } = useTranslation();
  const pathname = usePathname();
  const [currentPage, setCurrentPage] = useState(1);

  const { paginatedData, totalPages } = useMemo(() => {
    const newsArray = Array.isArray(initialNews) ? initialNews : [];
    const total = Math.ceil(newsArray.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return {
      paginatedData: newsArray.slice(startIndex, endIndex),
      totalPages: total,
    };
  }, [initialNews, currentPage]);

  if (!initialNews || initialNews.length === 0) {
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
      {paginatedData.map((post) => (
        <NewsListItemCompact key={post._id as string} post={post} />
      ))}

      {totalPages > 1 && (
        <div className="pt-4">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            basePath={pathname}
          />
        </div>
      )}
    </div>
  );
}
