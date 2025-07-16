import type { Metadata } from "next";
import axios from "axios";
import { IPost } from "@/models/Post";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import { Newspaper } from "lucide-react";
import Script from "next/script";
import { getI18n } from "@/lib/i18n/server";
import { generateHreflangTags } from "@/lib/hreflang";
import NewsPageClient from "./NewsPageClient"; // We will create this next

const PAGE_PATH = "/football/news";
const ITEMS_PER_PAGE = 8; // Keep this consistent

const fetchNews = async (): Promise<IPost[]> => {
  try {
    const { data } = await axios.get(
      `${process.env.NEXT_PUBLIC_PUBLIC_APP_URL}/api/posts?status=published`
    );
    return data;
  } catch (error) {
    console.error("Failed to fetch news articles on server:", error);
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

  const pageTitle = t("news_page_meta_title");
  const pageDescription = t("news_page_meta_description");

  return {
    title: pageTitle,
    description: pageDescription,
    alternates: hreflangAlternates,
  };
}

// --- Helper function to generate JSON-LD for the first page ---
const generateInitialJsonLd = (posts: IPost[], t: Function) => {
  const paginatedPosts = posts.slice(0, ITEMS_PER_PAGE);
  if (paginatedPosts.length === 0) return null;

  const itemListElement = paginatedPosts.map((post, index) => {
    // Note: The URL is now partial, which is fine for schema
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
    name: t("latest_news"),
    description: t("latest_news_subtitle"),
    itemListElement,
  };
};

export default async function NewsPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = await getI18n(locale);
  const allNews = await fetchNews();
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
                  {t("latest_news")}
                </h1>
                <p className="text-brand-muted">{t("latest_news_subtitle")}</p>
              </div>
            </div>
            {/* All interactive logic is now moved to the client component */}
            <NewsPageClient initialNews={allNews} />
          </main>
        </div>
      </div>
    </>
  );
}
