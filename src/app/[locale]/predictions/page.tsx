// ===== src/app/[locale]/predictions/page.tsx =====

import type { Metadata } from "next";
import { Suspense } from "react";
import { BrainCircuit } from "lucide-react";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import { getI18n } from "@/lib/i18n/server";
import { generateHreflangTags } from "@/lib/hreflang";
import PredictionsPageClient from "./PredictionsPageClient";
import { PredictionCardSkeleton } from "@/components/predictions/PredictionCard";
import AdSlotWidget from "@/components/AdSlotWidget";
import RecentNewsWidget from "@/components/RecentNewsWidget";

const PAGE_PATH = "/predictions";

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getI18n(locale);
  const pageTitle = t("predictions_page_meta_title");
  const pageDescription = t("predictions_page_meta_description");
  const hreflangAlternates = await generateHreflangTags(PAGE_PATH, "", locale);

  return {
    title: pageTitle,
    description: pageDescription,
    alternates: hreflangAlternates,
    openGraph: {
      title: pageTitle,
      description: pageDescription,
      url: `${process.env.NEXT_PUBLIC_PUBLIC_APP_URL}/${locale}${PAGE_PATH}`,
      siteName: "FanSkor",
      type: "website",
    },
  };
}

const PageSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
    {Array.from({ length: 12 }).map((_, i) => (
      <PredictionCardSkeleton key={i} />
    ))}
  </div>
);

export default async function PredictionsPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = await getI18n(locale);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="container mx-auto flex-1 w-full lg:grid lg:grid-cols-[288px_1fr_288px] lg:gap-8 lg:items-start p-4 lg:p-0 lg:py-6">
        <Sidebar />
        <main className="min-w-0">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-indigo-500/10 rounded-lg">
              <BrainCircuit className="w-8 h-8 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-4xl font-extrabold text-white">
                {t("predictions_page_title")}
              </h1>
              <p className="text-brand-muted">
                {t("predictions_page_subtitle")}
              </p>
            </div>
          </div>

          <Suspense fallback={<PageSkeleton />}>
            <PredictionsPageClient />
          </Suspense>
        </main>
        <aside className="hidden lg:block lg:col-span-1 space-y-8 min-w-0">
          <RecentNewsWidget />
          <AdSlotWidget location="homepage_right_sidebar" />
        </aside>
      </div>
    </div>
  );
}
