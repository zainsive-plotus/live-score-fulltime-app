// ===== src/app/football/news/page.tsx =====

"use client";

import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { IPost, SportsCategory, NewsType } from "@/models/Post";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import Pagination from "@/components/Pagination";
import NewsListItem, { NewsListItemSkeleton } from "@/components/NewsListItem";
import { Info, Newspaper, Tag, Type } from "lucide-react";
import Script from "next/script";

export const dynamic = "force-dynamic";

const ITEMS_PER_PAGE = 8;

// --- NEW: Filter options defined as constants for clarity ---
const sportsFilterOptions: { value: SportsCategory | "all"; label: string }[] =
  [
    { value: "all", label: "All Sports" },
    { value: "football", label: "Football" },
    { value: "basketball", label: "Basketball" },
    { value: "tennis", label: "Tennis" },
  ];

const newsTypeFilterOptions: { value: NewsType | "all"; label: string }[] = [
  { value: "all", label: "All Types" },
  { value: "news", label: "News" },
  { value: "prediction", label: "Predictions" },
  { value: "reviews", label: "Reviews" },
  { value: "highlights", label: "Highlights" },
];

// Fetcher function remains the same, fetching all published posts
const fetchNews = async (): Promise<IPost[]> => {
  const { data } = await axios.get("/api/posts?status=published");
  return data;
};

export default function NewsPage() {
  const [currentPage, setCurrentPage] = useState(1);
  // --- NEW: State to manage both filters simultaneously ---
  const [filters, setFilters] = useState<{
    sportsCategory: SportsCategory | "all";
    newsType: NewsType | "all";
  }>({
    sportsCategory: "all",
    newsType: "all",
  });

  const { data: allNews, isLoading } = useQuery<IPost[]>({
    queryKey: ["allNewsArticles"],
    queryFn: fetchNews,
    staleTime: 1000 * 60 * 5,
  });

  // --- ENHANCED: Filtering and Pagination Logic ---
  const { paginatedData, totalPages, filteredCount } = useMemo(() => {
    if (!allNews) return { paginatedData: [], totalPages: 0, filteredCount: 0 };

    // Apply filters sequentially
    const filteredNews = allNews.filter((post) => {
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
  }, [allNews, currentPage, filters]);

  // Reset page to 1 when any filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  // JSON-LD for SEO (Unchanged)
  const generateJsonLd = () => {
    /* ... unchanged ... */
  };

  return (
    <>
      <Script
        id="news-list-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(generateJsonLd()) }}
      />
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="container mx-auto flex-1 w-full lg:grid lg:grid-cols-[288px_1fr] lg:gap-8 lg:items-start">
          <Sidebar />
          <main className="min-w-0 p-4 lg:p-0 lg:py-6">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 bg-brand-purple/10 rounded-lg">
                <Newspaper className="w-8 h-8 text-brand-purple" />
              </div>
              <div>
                <h1 className="text-4xl font-extrabold text-white">
                  Latest News
                </h1>
                <p className="text-brand-muted">
                  Stay updated with the latest stories and analysis.
                </p>
              </div>
            </div>

            {/* --- NEW & ENHANCED: Filter Controls --- */}
            <div className="bg-brand-secondary p-4 rounded-lg mb-8 space-y-4">
              {/* Sports Category Filters */}
              <div className="flex items-center gap-3 flex-wrap">
                <span className="font-semibold text-brand-light flex items-center gap-2">
                  <Tag size={16} /> Sport:
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
              {/* News Type Filters */}
              <div className="flex items-center gap-3 flex-wrap">
                <span className="font-semibold text-brand-light flex items-center gap-2">
                  <Type size={16} /> Type:
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

            {/* Main Content Area */}
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => (
                  <NewsListItemSkeleton key={i} />
                ))}
              </div>
            ) : paginatedData.length > 0 ? (
              <div className="space-y-4">
                <p className="text-sm text-brand-muted px-2">
                  Showing {filteredCount} results...
                </p>
                {paginatedData.map((post) => (
                  <NewsListItem key={post._id} post={post} />
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
                <p className="text-xl font-bold text-white">No News Found</p>
                <p className="text-brand-muted mt-2">
                  Your selected filters did not match any articles. Try a
                  different combination.
                </p>
              </div>
            )}
          </main>
        </div>
      </div>
    </>
  );
}
