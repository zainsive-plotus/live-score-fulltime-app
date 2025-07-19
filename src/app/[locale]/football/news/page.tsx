import type { Metadata } from "next";
import axios from "axios";
import { IPost } from "@/models/Post";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import { Newspaper, Info } from "lucide-react";
import Script from "next/script";
import { getI18n } from "@/lib/i18n/server";
import { generateHreflangTags } from "@/lib/hreflang";
import NewsListItem from "@/components/NewsListItem";
import Pagination from "@/components/Pagination";
import { Suspense } from "react";
import { NewsListItemSkeleton } from "@/components/NewsListItem";

const PAGE_PATH = "/football/news";
const ITEMS_PER_PAGE = 8; // Define how many items per page for pagination

// Fetch only football news
const fetchNews = async (locale: string): Promise<IPost[]> => {
  try {
    const { data } = await axios.get(
      `${process.env.NEXT_PUBLIC_PUBLIC_APP_URL}/api/posts?status=published&sportsCategory=football&language=${locale}`
    );
    return data;
  } catch (error) {
    console.error("[Football News Page] Failed to fetch news:", error);
    return [];
  }
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getI18n(locale);
  const hreflangAlternates = await generateHreflangTags(PAGE_PATH, locale);
  const pageTitle = t("news_page_meta_title"); // You may want to make this more specific, e.g., "Football News & Predictions"
  const pageDescription = t("news_page_meta_description");

  return {
    title: pageTitle,
    description: pageDescription,
    alternates: hreflangAlternates,
  };
}

const generateInitialJsonLd = (posts: IPost[], t: Function) => {
  const paginatedPosts = posts.slice(0, ITEMS_PER_PAGE);
  if (paginatedPosts.length === 0) return null;

  const itemListElement = paginatedPosts.map((post, index) => {
    const postUrl = `${process.env.NEXT_PUBLIC_PUBLIC_APP_URL}/football/news/${post.slug}`;
    return {
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "NewsArticle",
        mainEntityOfPage: { "@type": "WebPage", "@id": postUrl },
        headline: post.title,
        image:
          post.featuredImage ||
          `${process.env.NEXT_PUBLIC_PUBLIC_APP_URL}/og-image.jpg`,
        datePublished: post.createdAt,
        dateModified: post.updatedAt,
        author: { "@type": "Organization", name: "Fan Skor" },
        publisher: {
          "@type": "Organization",
          name: "Fan Skor",
          logo: {
            "@type": "ImageObject",
            url: `${process.env.NEXT_PUBLIC_PUBLIC_APP_URL}/fanskor-transparent.webp`,
          },
        },
        description: post.metaDescription,
      },
    };
  });

  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: t("latest_football_news"),
    description: t("latest_football_news_subtitle"),
    itemListElement,
  };
};

// Main Page Component
export default async function FootballNewsPage({
  params,
}: {
  params: Promise<{ locale: string; page?: string }>;
}) {
  const { locale, page } = await params;
  const currentPage = Number(page) || 1;

  const t = await getI18n(locale);
  const allNews = await fetchNews(locale);
  const jsonLdData = generateInitialJsonLd(allNews, t);

  const totalPages = Math.ceil(allNews.length / ITEMS_PER_PAGE);
  const paginatedNews = allNews.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <>
      {jsonLdData && (
        <Script
          id="news-list-jsonld"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdData) }}
        />
      )}
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
                  {t("latest_football_news")}
                </h1>
                <p className="text-brand-muted">
                  {t("latest_football_news_subtitle")}
                </p>
              </div>
            </div>

            {/* Content Display Logic */}
            <Suspense
              fallback={
                <div className="space-y-4">
                  <NewsListItemSkeleton />
                  <NewsListItemSkeleton />
                </div>
              }
            >
              {paginatedNews.length > 0 ? (
                <div className="space-y-4">
                  {paginatedNews.map((post) => (
                    <NewsListItem key={post._id as string} post={post} />
                  ))}
                  {totalPages > 1 && (
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={() => {
                        // This will be handled by client component if we refactor, for now it's static
                      }}
                    />
                  )}
                </div>
              ) : (
                <div className="text-center py-20 bg-brand-secondary rounded-lg">
                  <Info size={32} className="mx-auto text-brand-muted mb-3" />
                  <p className="text-xl font-bold text-white">
                    {t("no_news_found_title")}
                  </p>
                  <p className="text-brand-muted mt-2">
                    {t("no_football_news_found_subtitle")}
                  </p>
                </div>
              )}
            </Suspense>
          </main>
        </div>
      </div>
    </>
  );
}
