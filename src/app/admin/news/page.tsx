// src/app/football/news/page.tsx
"use client";

import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { IPost } from "@/models/Post";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import Pagination from "@/components/Pagination";
import NewsListItem, { NewsListItemSkeleton } from "@/components/NewsListItem";
import { Info, Newspaper } from "lucide-react";
import Script from "next/script";
import PostCategories, { NewsCategory } from "@/components/PostCategories";

export const dynamic = "force-dynamic";

const ITEMS_PER_PAGE = 8;

const fetchNews = async (): Promise<IPost[]> => {
  const { data } = await axios.get("/api/posts?status=published");
  return data;
};

export default function NewsPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [activeCategory, setActiveCategory] =
    useState<NewsCategory>("trending");

  const { data: allNews, isLoading } = useQuery<IPost[]>({
    queryKey: ["allNewsArticles"],
    queryFn: fetchNews,
    staleTime: 1000 * 60 * 5,
  });

  const { paginatedData, totalPages } = useMemo(() => {
    if (!allNews) return { paginatedData: [], totalPages: 0 };

    const filterCategory =
      activeCategory === "trending" ? "all" : activeCategory;

    // --- MODIFIED: Filtering logic for multiple categories ---
    const filteredNews =
      filterCategory === "all"
        ? allNews
        : allNews.filter((post) => {
            // A post is included if its `sport` array contains the active category.
            // Ensure post.sport is an array before calling .includes()
            return (
              Array.isArray(post.sport) && post.sport.includes(filterCategory)
            );
          });

    const totalPages = Math.ceil(filteredNews.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const paginatedData = filteredNews.slice(startIndex, endIndex);

    return { paginatedData, totalPages };
  }, [allNews, currentPage, activeCategory]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeCategory]);

  const generateJsonLd = () => {
    if (!paginatedData || paginatedData.length === 0) return null;

    const items = paginatedData.map((post) => ({
      "@type": "NewsArticle",
      headline: post.title,
      image: [post.featuredImage || ""],
      datePublished: post.createdAt,
      dateModified: post.updatedAt,
      author: [
        {
          "@type": "Person",
          name: post.author,
        },
      ],
      // --- MODIFIED: Add keywords from categories ---
      keywords: Array.isArray(post.sport) ? post.sport.join(", ") : "",
    }));

    return {
      "@context": "https://schema.org",
      "@type": "ItemList",
      itemListElement: items.map((item, index) => ({
        "@type": "ListItem",
        position: (currentPage - 1) * ITEMS_PER_PAGE + index + 1,
        item: item,
      })),
    };
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

            <PostCategories
              activeCategory={activeCategory}
              onCategoryChange={setActiveCategory}
            />

            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => (
                  <NewsListItemSkeleton key={i} />
                ))}
              </div>
            ) : paginatedData.length > 0 ? (
              <div className="space-y-4">
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
                  There are no articles available in the "
                  {activeCategory === "trending"
                    ? "All"
                    : activeCategory.replace("_", " ")}
                  " category.
                </p>
              </div>
            )}
          </main>
        </div>
      </div>
    </>
  );
}
