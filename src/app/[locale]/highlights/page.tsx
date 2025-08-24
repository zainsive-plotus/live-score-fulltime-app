import type { Metadata } from "next";
import { Suspense } from "react";
import { PlayCircle } from "lucide-react";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import { getI18n } from "@/lib/i18n/server";
import { generateHreflangTags } from "@/lib/hreflang";
import HighlightsPageClient from "./HighlightsPageClient";
import { HighlightCardSkeleton } from "@/components/HighlightCard";
import RecentNewsWidget from "@/components/RecentNewsWidget";
import AdSlotWidget from "@/components/AdSlotWidget";

const PAGE_PATH = "/highlights";

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getI18n(locale);
  const pageTitle = t("highlights_page_meta_title");
  const pageDescription = t("highlights_page_meta_description");
  const hreflangAlternates = await generateHreflangTags(PAGE_PATH, "", locale);

  return {
    title: pageTitle,
    description: pageDescription,
    alternates: hreflangAlternates,
    openGraph: {
      title: pageTitle,
      description: pageDescription,
      url: `${process.env.NEXT_PUBLIC_PUBLIC_APP_URL}/${locale}${PAGE_PATH}`,
      siteName: "Fan Skor",
      type: "website",
    },
  };
}

const PageSkeleton = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
    {Array.from({ length: 12 }).map((_, i) => (
      <HighlightCardSkeleton key={i} />
    ))}
  </div>
);

export default async function HighlightsPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = await getI18n(locale);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      {/* CHANGE: Updated grid layout to three columns */}
      <div className="container mx-auto flex-1 w-full lg:grid lg:grid-cols-[288px_1fr_288px] lg:gap-8 lg:items-start p-4 lg:p-0 lg:py-6">
        <Sidebar />
        <main className="min-w-0">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-[var(--brand-accent)]/10 rounded-lg">
              <PlayCircle className="w-8 h-8 text-[var(--brand-accent)]" />
            </div>
            <div>
              <h1 className="text-4xl font-extrabold text-white">
                {t("highlights_page_title")}
              </h1>
              <p className="text-brand-muted">
                {t("highlights_page_subtitle")}
              </p>
            </div>
          </div>

          <Suspense fallback={<PageSkeleton />}>
            <HighlightsPageClient />
          </Suspense>
        </main>

        {/* CHANGE: Added the right sidebar */}
        <aside className="hidden lg:block lg:col-span-1 space-y-8 min-w-0">
          <RecentNewsWidget />
          <AdSlotWidget location="homepage_right_sidebar" />
        </aside>
      </div>
    </div>
  );
}
