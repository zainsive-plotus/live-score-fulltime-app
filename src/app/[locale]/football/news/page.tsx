// ===== src/app/[locale]/football/news/page.tsx =====

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
import NewsPageClient from "./NewsPageClient";
import { NewsListItemCompactSkeleton } from "@/components/NewsListItemCompact";

const PAGE_PATH = "/football/news";
const ITEMS_PER_PAGE = 10;

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const { locale } = params;

  const t = await getI18n(locale);

  // --- THIS IS THE DEFINITIVE FIX ---
  // The arguments were in the wrong order.
  // Correct signature: generateHreflangTags(basePath, currentSlug, currentLocale)
  // Correct call for this static page:
  const hreflangAlternates = await generateHreflangTags(PAGE_PATH, "", locale);
  // --- END OF FIX ---

  const pageTitle = t("news_page_meta_title");
  const pageDescription = t("news_page_meta_description");

  return {
    title: pageTitle,
    description: pageDescription,
    alternates: hreflangAlternates,
  };
}

const generateInitialJsonLd = (posts: IPost[], t: Function) => {
  if (!posts || posts.length === 0) return null;

  const itemListElement = posts.map((post, index) => {
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
        author: { "@type": "Organization", name: "Fanskor" },
        publisher: {
          "@type": "Organization",
          name: "Fanskor",
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
  searchParams,
}: {
  params: { locale: string };
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const { locale } = params;
  const t = await getI18n(locale);

  const currentPage = Number(searchParams?.page || 1);

  const initialData = await getNews({
    locale,
    sportsCategory: "football",
    newsType: "news",
    page: currentPage,
    limit: ITEMS_PER_PAGE,
  });

  const jsonLdData = generateInitialJsonLd(initialData.posts, t);

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
              <NewsPageClient initialData={initialData} />
            </Suspense>
          </main>
        </div>
      </div>
    </>
  );
}
