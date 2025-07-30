// ===== src/app/[locale]/news/[category]/page.tsx =====

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

const VALID_CATEGORIES = ["football", "transfer", "recent"];

// Helper to generate dynamic metadata based on the category
export async function generateMetadata({
  params: { locale, category },
}: {
  params: { locale: string; category: string };
}): Promise<Metadata> {
  const t = await getI18n(locale);
  
  let pageTitle = t("news_archive_title"); // Default

  if (category === "football") pageTitle = t("football_news_archive_title");
  if (category === "transfer") pageTitle = t("transfer_news_archive_title");
  if (category === "recent") pageTitle = t("recent_news_archive_title");

  return {
    title: `${pageTitle} | FanSkor`,
    description: t("news_archive_subtitle"),
  };
}

export default async function NewsCategoryPage({
  params: { locale, category },
}: {
  params: { locale: string; category: string };
}) {
  const t = await getI18n(locale);

  console.log(category);
  

  if (!VALID_CATEGORIES.includes(category)) {
    notFound();
  }

  // Determine filter based on the category slug
  const filterOptions: { newsType?: NewsType; sportsCategory?: SportsCategory } = {};
  if (category === "football") filterOptions.sportsCategory = "football";
  if (category === "transfer") filterOptions.newsType = "transfer";
  if (category === "recent") filterOptions.newsType = "recent";

  const allNews = (await getNews({ locale, ...filterOptions })) ?? [];

  let pageTitle = t("news_archive_title");
  if (category === "football") pageTitle = t("football_news_archive_title");
  if (category === "transfer") pageTitle = t("transfer_news_archive_title");
  if (category === "recent") pageTitle = t("recent_news_archive_title");

  console.log(allNews);

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
            <NewsArchiveClient initialNews={allNews} />
          </Suspense>
        </main>
      </div>
    </div>
  );
}

// --- Start of Fix ---
// This function tells Next.js which category pages to pre-build at build time.
// Without this, Next.js doesn't know that "/news/recent" is a valid page to generate.
export async function generateStaticParams() {
  return VALID_CATEGORIES.map((category) => ({
    category: category,
  }));
}
// --- End of Fix ---