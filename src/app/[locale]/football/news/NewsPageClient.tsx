"use client";

import { useState, useMemo, useEffect } from "react";
import { IPost, SportsCategory, NewsType } from "@/models/Post";
import Pagination from "@/components/Pagination";
import NewsListItem, { NewsListItemSkeleton } from "@/components/NewsListItem";
import { Info, Tag, Type } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

const ITEMS_PER_PAGE = 8;

interface NewsPageClientProps {
  initialNews: IPost[];
}

export default function NewsPageClient({ initialNews }: NewsPageClientProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const { t } = useTranslation();

  const sportsFilterOptions: {
    value: SportsCategory | "all";
    label: string;
  }[] = [
    { value: "all", label: t("filter_all_sports") },
    { value: "football", label: t("football") },
    { value: "basketball", label: t("basketball") },
    { value: "tennis", label: t("tennis") },
  ];

  const newsTypeFilterOptions: { value: NewsType | "all"; label: string }[] = [
    { value: "all", label: t("filter_all_types") },
    { value: "news", label: t("news") },
    { value: "prediction", label: t("prediction") },
    { value: "reviews", label: t("reviews") },
    { value: "highlights", label: t("highlights") },
  ];

  const [filters, setFilters] = useState<{
    sportsCategory: SportsCategory | "all";
    newsType: NewsType | "all";
  }>({
    sportsCategory: "all",
    newsType: "all",
  });

  // Data is passed directly as a prop, no need for useQuery here.
  const { paginatedData, totalPages, filteredCount } = useMemo(() => {
    if (!initialNews)
      return { paginatedData: [], totalPages: 0, filteredCount: 0 };

    const filteredNews = initialNews.filter((post) => {
      const sportMatch =
        filters.sportsCategory === "all" ||
        post.sportsCategory.includes(filters.sportsCategory);
      const typeMatch =
        filters.newsType === "all" || post.newsType === filters.newsType;
      return sportMatch && typeMatch;
    });

    const filteredCount = filteredNews.length;
    const totalPages = Math.ceil(filteredNews.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const paginatedData = filteredNews.slice(startIndex, endIndex);

    return { paginatedData, totalPages, filteredCount };
  }, [initialNews, currentPage, filters]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  return (
    <>
      <div className="bg-brand-secondary p-4 rounded-lg mb-8 space-y-4">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="font-semibold text-brand-light flex items-center gap-2">
            <Tag size={16} /> {t("sport_filter_label")}:
          </span>
          {sportsFilterOptions.map((option) => (
            <button
              key={option.value}
              onClick={() =>
                setFilters((f) => ({
                  ...f,
                  sportsCategory: option.value,
                }))
              }
              className={`px-3 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                filters.sportsCategory === option.value
                  ? "bg-brand-purple text-white"
                  : "bg-gray-700 text-brand-muted hover:bg-gray-600"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <span className="font-semibold text-brand-light flex items-center gap-2">
            <Type size={16} /> {t("type_filter_label")}:
          </span>
          {newsTypeFilterOptions.map((option) => (
            <button
              key={option.value}
              onClick={() =>
                setFilters((f) => ({ ...f, newsType: option.value }))
              }
              className={`px-3 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                filters.newsType === option.value
                  ? "bg-brand-purple text-white"
                  : "bg-gray-700 text-brand-muted hover:bg-gray-600"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {paginatedData.length > 0 ? (
        <div className="space-y-4">
          <p className="text-sm text-brand-muted px-2">
            {t("showing_results", { count: filteredCount })}
          </p>
          {paginatedData.map((post) => (
            <NewsListItem key={post._id as string} post={post} />
          ))}
          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          )}
        </div>
      ) : (
        <div className="text-center py-20 bg-brand-secondary rounded-lg">
          <Info size={32} className="mx-auto text-brand-muted mb-3" />
          <p className="text-xl font-bold text-white">
            {t("no_news_found_title")}
          </p>
          <p className="text-brand-muted mt-2">{t("no_news_found_subtitle")}</p>
        </div>
      )}
    </>
  );
}
