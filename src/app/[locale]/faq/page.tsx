// ===== src/app/[locale]/faq/page.tsx (AI Crawlability Enhanced) =====

import type { Metadata } from "next";
import axios from "axios";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import { HelpCircle } from "lucide-react";
import AdSlotWidget from "@/components/AdSlotWidget";
import RecentNewsWidget from "@/components/RecentNewsWidget";
import { getI18n } from "@/lib/i18n/server";
import { IFaq } from "@/models/Faq";
import FaqClient from "@/components/FaqClient";
import { generateHreflangTags } from "@/lib/hreflang";
import Script from "next/script";
import { WithContext, FAQPage } from "schema-dts"; // Import schema types

const PAGE_PATH = "/faq";
const BASE_URL =
  process.env.NEXT_PUBLIC_PUBLIC_APP_URL || "http://localhost:3000";

async function fetchFaqs(): Promise<IFaq[]> {
  try {
    const { data } = await axios.get(`${BASE_URL}/api/faqs`);
    return data;
  } catch (error) {
    console.error(`[FAQ Page] Failed to fetch FAQs:`, error);
    return [];
  }
}

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getI18n(locale);
  const hreflangAlternates = await generateHreflangTags(PAGE_PATH, locale);

  return {
    title: t("faq_meta_title"),
    description: t("faq_meta_description"),
    alternates: hreflangAlternates,
  };
}

export default async function FaqPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = await getI18n(locale);
  const allFaqs = await fetchFaqs();

  // --- ENHANCED JSON-LD STRUCTURED DATA ---
  const jsonLd: WithContext<FAQPage> = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: allFaqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  return (
    <>
      <Script
        id="faq-page-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="container mx-auto flex-1 w-full lg:grid lg:grid-cols-[288px_1fr_288px] lg:gap-8 lg:items-start p-4 lg:p-0 lg:py-6">
          <Sidebar />

          <main className="min-w-0 space-y-8">
            <div className="bg-brand-secondary p-6 rounded-lg shadow-xl text-center">
              <HelpCircle className="w-12 h-12 text-[var(--brand-accent)] mx-auto mb-4" />
              <h1 className="text-4xl font-extrabold text-white">
                {t("faq_page_main_title")}
              </h1>
              <p className="text-text-muted mt-2 max-w-2xl mx-auto">
                {t("faq_page_subtitle")}
              </p>
            </div>

            <FaqClient initialFaqs={allFaqs} />
          </main>

          <aside className="hidden lg:block lg:col-span-1 space-y-8 min-w-0">
            <RecentNewsWidget />
            <AdSlotWidget location="homepage_right_sidebar" />
          </aside>
        </div>
      </div>
    </>
  );
}
