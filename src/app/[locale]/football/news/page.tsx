// ===== src/app/[locale]/football/news/page.tsx (Redesigned) =====

import type { Metadata } from "next";
import { IPost } from "@/models/Post";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import { Newspaper } from "lucide-react";
import Script from "next/script";
import { getI18n } from "@/lib/i18n/server";
import { generateHreflangTags } from "@/lib/hreflang";
import { Suspense } from "react";
import { getNews } from "@/lib/data/news";
import NewsPageClient from "./NewsPageClient"; // <-- Import the new dedicated client component
import { NewsListItemCompactSkeleton } from "@/components/NewsListItemCompact"; // <-- Import the new skeleton

const PAGE_PATH = "/football/news";
const ITEMS_PER_PAGE = 10; // Sync with client component

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  const t = await getI18n(locale);
  const hreflangAlternates = await generateHreflangTags(PAGE_PATH, locale);
  const pageTitle = t("news_page_meta_title");
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
    const postUrl = `/${post.language}/news/${post.slug}`;
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

export default async function FootballNewsPage({
  params,
}: {
  params: { locale: string };
}) {
  const { locale } = params;
  const t = await getI18n(locale);

  const allNews = (await getNews({ locale, sportsCategory: "football" })) ?? [];

  const jsonLdData = generateInitialJsonLd(allNews, t);

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

            <Suspense
              fallback={
                <div className="space-y-4">
                  <NewsListItemCompactSkeleton />
                  <NewsListItemCompactSkeleton />
                  <NewsListItemCompactSkeleton />
                  <NewsListItemCompactSkeleton />
                </div>
              }
            >
              <NewsPageClient initialNews={allNews} />
            </Suspense>
          </main>
        </div>
      </div>
    </>
  );
}
