"use client";

import { useQuery } from "@tanstack/react-query";
import NewsItemCard, {
  NewsArticleType,
  NewsItemCardSkeleton,
} from "./NewsItemCard";
import axios from "axios";
import { IPost } from "@/models/Post";
import StyledLink from "./StyledLink"; // Import the StyledLink component
import { ArrowRight } from "lucide-react"; // Import an icon for the button
import { useTranslation } from "@/hooks/useTranslation";

// The fetcher function remains the same, it fetches all published posts.
const fetchNews = async (): Promise<NewsArticleType[]> => {
  const { data } = await axios.get("/api/posts?status=published");
  // Transform the API response into the format the card component expects.
  const transformedNews: NewsArticleType[] = data.map((post: IPost) => ({
    id: post._id,
    title: post.title,
    excerpt: post.content.replace(/<[^>]*>?/gm, "").substring(0, 150) + "...",
    imageUrl:
      post.featuredImage ||
      "https://images.unsplash.com/photo-1599508704512-2f19efd1e35f?q=80&w=1935&auto=format&fit=crop",
    articleUrl: `/football/news/${post.slug}`,
  }));

  return transformedNews;
};

export default function NewsSection() {
  const {
    data: news,
    isLoading,
    error,
  } = useQuery<NewsArticleType[]>({
    queryKey: ["newsArticles"],
    queryFn: fetchNews,
    staleTime: 1000 * 60 * 10, // Cache for 10 minutes
  });

  const { t } = useTranslation();

  return (
    <section>
      {/* --- NEW: Section Header with Title and "See All" Button --- */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-white">{t("latest_news")}</h3>
        {/* The button only shows if there are more than 2 articles */}
        {news && news.length > 2 && (
          <StyledLink
            href="/football/news"
            className="flex items-center gap-1 text-sm font-semibold text-text-muted transition-colors hover:text-white"
          >
            See all
            <ArrowRight size={16} />
          </StyledLink>
        )}
      </div>

      <div className="space-y-4">
        {isLoading ? (
          // Show two skeletons while loading
          <>
            <NewsItemCardSkeleton />
            <NewsItemCardSkeleton />
          </>
        ) : error ? (
          <div
            className="rounded-xl p-6 text-center text-text-muted"
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            <p>Could not load news articles.</p>
          </div>
        ) : news && news.length > 0 ? (
          // --- ENHANCEMENT: Use .slice(0, 2) to only show the first two articles ---
          news
            .slice(0, 2)
            .map((article) => (
              <NewsItemCard key={article.id} article={article} />
            ))
        ) : (
          <div
            className="rounded-xl p-6 text-center text-text-muted"
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            <p>No news articles available yet.</p>
          </div>
        )}
      </div>
    </section>
  );
}
