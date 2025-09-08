// ===== src/app/[locale]/news/page.tsx =====

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

const PAGE_PATH = "/news";

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getI18n(locale);
  const hreflangAlternates = await generateHreflangTags(PAGE_PATH, "", locale);
  const pageTitle = t("general_news_meta_title");
  const pageDescription = t("general_news_meta_description");

  return {
    title: pageTitle,
    description: pageDescription,
    alternates: hreflangAlternates,
  };
}

const generateInitialJsonLd = (posts: IPost[], t: Function) => {
  if (posts.length === 0) return null;

  const itemListElement = posts.map((post, index) => {
    const postUrl = post.originalSourceUrl
      ? post.originalSourceUrl
      : `${process.env.NEXT_PUBLIC_PUBLIC_APP_URL}/${post.language}/news/${post.slug}`;

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
    name: t("latest_news"),
    description: t("latest_news_subtitle"),
    itemListElement,
  };
};

const NewsPageSkeleton = () => (
  <div className="space-y-12 animate-pulse">
    <div className="w-full aspect-video md:aspect-[2.4/1] bg-brand-secondary rounded-xl"></div>
    <div>
      <div className="h-8 w-1/3 bg-gray-700 rounded mb-6"></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="aspect-square bg-brand-secondary rounded-xl"></div>
        <div className="aspect-square bg-brand-secondary rounded-xl"></div>
        <div className="aspect-square bg-brand-secondary rounded-xl"></div>
        <div className="aspect-square bg-brand-secondary rounded-xl"></div>
      </div>
    </div>
  </div>
);

export default async function NewsHubPage({
  params,
}: {
  params: { locale: string };
}) {
  const { locale } = params;
  const t = await getI18n(locale);

  // --- Start of Fix ---
  // The calls to getNews now correctly destructure the 'posts' array from the returned object.
  const [recentNews, footballNews, transferNews] = await Promise.all([
    getNews({ locale, newsType: "recent", limit: 5 }).then(
      (result) => result.posts
    ),
    getNews({
      locale,
      sportsCategory: "football",
      newsType: "news",
      limit: 8,
    }).then((result) => result.posts),
    getNews({ locale, newsType: "transfer", limit: 4 }).then(
      (result) => result.posts
    ),
  ]);
  // --- End of Fix ---

  const jsonLdData = generateInitialJsonLd(recentNews, t);

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
                  {t("news_hub_title")}
                </h1>
                <p className="text-brand-muted">{t("news_hub_subtitle")}</p>
              </div>
            </div>

            <Suspense fallback={<NewsPageSkeleton />}>
              <NewsPageClient
                recentNews={recentNews}
                footballNews={footballNews}
                transferNews={transferNews}
              />
            </Suspense>
          </main>
        </div>
      </div>
    </>
  );
}
