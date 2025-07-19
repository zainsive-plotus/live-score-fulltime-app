// ===== src/app/[locale]/news/page.tsx =====

import type { Metadata } from "next";
import axios from "axios";
import { IPost } from "@/models/Post";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import { Newspaper, Info } from "lucide-react";
import Script from "next/script";
import { getI18n } from "@/lib/i18n/server";
import { generateHreflangTags } from "@/lib/hreflang";
import Pagination from "@/components/Pagination";
import { Suspense } from "react";
import FeaturedNewsRow, {
  FeaturedNewsRowSkeleton,
} from "@/components/FeaturedNewsRow";
import CompactNewsItem, {
  CompactNewsItemSkeleton,
} from "@/components/CompactNewsItem";

const PAGE_PATH = "/news";
const ITEMS_PER_PAGE = 7; // 1 featured + 6 compact items

const fetchNews = async (locale: string): Promise<IPost[]> => {
  try {
    const { data } = await axios.get(
      `${process.env.NEXT_PUBLIC_PUBLIC_APP_URL}/api/posts?status=published&language=${locale}`
    );
    return data;
  } catch (error) {
    console.error(
      `[General News Page] Failed to fetch news for locale ${locale}:`,
      error
    );
    return [];
  }
};

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getI18n(locale);
  const hreflangAlternates = await generateHreflangTags(PAGE_PATH, locale);

  const pageTitle = t("general_news_meta_title");
  const pageDescription = t("general_news_meta_description");

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
    const postUrl = `${process.env.NEXT_PUBLIC_PUBLIC_APP_URL}/news/${post.slug}`;
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
    name: t("latest_news"),
    description: t("latest_news_subtitle"),
    itemListElement,
  };
};

export default async function GeneralNewsPage({
  params,
}: {
  params: { locale: string; page?: string };
}) {
  const { locale } = params;
  const currentPage = Number(params.page) || 1;

  const t = await getI18n(locale);
  const allNews = await fetchNews(locale);
  const jsonLdData = generateInitialJsonLd(allNews, t);

  const totalPages = Math.ceil(allNews.length / ITEMS_PER_PAGE);
  const paginatedNews = allNews.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const featuredArticle = paginatedNews.length > 0 ? paginatedNews[0] : null;
  const listArticles = paginatedNews.length > 1 ? paginatedNews.slice(1) : [];

  const translatedText = {
    featuredArticle: t("featured_article"),
    readMore: t("read_more"),
  };

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
                  {t("latest_news")}
                </h1>
                <p className="text-brand-muted">{t("latest_news_subtitle")}</p>
              </div>
            </div>

            <Suspense
              fallback={
                <div className="space-y-4">
                  <FeaturedNewsRowSkeleton />
                  <div className="space-y-2">
                    <CompactNewsItemSkeleton />
                    <CompactNewsItemSkeleton />
                    <CompactNewsItemSkeleton />
                  </div>
                </div>
              }
            >
              {paginatedNews.length > 0 && featuredArticle ? (
                <>
                  <FeaturedNewsRow
                    post={featuredArticle}
                    tFeaturedArticle={translatedText.featuredArticle}
                    tReadMore={translatedText.readMore}
                  />

                  {listArticles.length > 0 && (
                    <div className="space-y-2">
                      {listArticles.map((post) => (
                        <CompactNewsItem key={post._id as string} post={post} />
                      ))}
                    </div>
                  )}

                  {totalPages > 1 && (
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={() => {
                        // Pagination would need to navigate, which requires a client component.
                      }}
                    />
                  )}
                </>
              ) : (
                <div className="text-center py-20 bg-brand-secondary rounded-lg">
                  <Info size={32} className="mx-auto text-brand-muted mb-3" />
                  <p className="text-xl font-bold text-white">
                    {t("no_news_found_title")}
                  </p>
                  <p className="text-brand-muted mt-2">
                    {t("no_general_news_found_subtitle")}
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
