// ===== src/app/[locale]/news/category/[category]/page.tsx =====

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import { Newspaper } from "lucide-react";
import { getI18n } from "@/lib/i18n/server";
import { Suspense } from "react";
import { getNews } from "@/lib/data/news";
import { NewsListItemCompactSkeleton } from "@/components/NewsListItemCompact";
import NewsArchiveClient from "./NewsArchiveClient";
import { NewsType, SportsCategory } from "@/models/Post";
import { generateHreflangTags } from "@/lib/hreflang"; // <-- IMPORT HREFLANG

export const dynamic = "force-dynamic";

const VALID_CATEGORIES = ["football", "transfer", "recent", "news"];
const ITEMS_PER_PAGE = 10;

// --- THIS IS THE FIX ---
// We are adding the generateMetadata function to this page.
export async function generateMetadata({
  params: { locale, category },
}: {
  params: { locale: string; category: string };
}): Promise<Metadata> {
  if (!VALID_CATEGORIES.includes(category)) {
    notFound();
  }

  const t = await getI18n(locale);

  // Generate a dynamic title based on the category
  let pageTitle = t("news_archive_title"); // Default title
  if (category === "football") pageTitle = t("football_news_archive_title");
  if (category === "transfer") pageTitle = t("transfer_news_archive_title");
  if (category === "recent") pageTitle = t("recent_news_archive_title");

  // Generate the crucial canonical and hreflang tags
  const pagePath = `/news/category/${category}`;
  const hreflangAlternates = await generateHreflangTags(
    "/news/category",
    category,
    locale
  );

  return {
    title: pageTitle, // Use the dynamic title
    description: t("news_archive_subtitle"),
    alternates: hreflangAlternates, // Add the canonical and hreflang tags
  };
}
// --- END OF FIX ---

export default async function NewsCategoryPage({
  params: { locale, category },
  searchParams,
}: {
  params: { locale: string; category: string };
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const t = await getI18n(locale);

  if (!VALID_CATEGORIES.includes(category)) {
    notFound();
  }

  const currentPage = Number(searchParams?.page || 1);

  const filterOptions: {
    newsType?: NewsType;
    sportsCategory?: SportsCategory;
  } = {};
  if (category === "football") filterOptions.sportsCategory = "football";
  if (category === "transfer") filterOptions.newsType = "transfer";
  if (category === "recent") filterOptions.newsType = "recent";

  const { posts: allNews, pagination } = await getNews({
    locale,
    ...filterOptions,
    page: currentPage,
    limit: ITEMS_PER_PAGE,
  });

  let pageTitle = t("news_archive_title");
  if (category === "football") pageTitle = t("football_news_archive_title");
  if (category === "transfer") pageTitle = t("transfer_news_archive_title");
  if (category === "recent") pageTitle = t("recent_news_archive_title");

  return (
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
              <h1 className="text-4xl font-extrabold text-white capitalize">
                {pageTitle}
              </h1>
              <p className="text-brand-muted">{t("news_archive_subtitle")}</p>
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
            <NewsArchiveClient
              initialData={{ posts: allNews, pagination }}
              category={category}
            />
          </Suspense>
        </main>
      </div>
    </div>
  );
}

// export async function generateStaticParams() {
//   return VALID_CATEGORIES.map((category) => ({
//     category: category,
//   }));
// }
