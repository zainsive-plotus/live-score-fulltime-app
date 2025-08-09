// ===== src/app/[locale]/author/page.tsx (AI Crawlability Enhanced) =====

import type { Metadata } from "next";
import axios from "axios";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import { UserCircle } from "lucide-react";
import AdSlotWidget from "@/components/AdSlotWidget";
import RecentNewsWidget from "@/components/RecentNewsWidget";
import { getI18n } from "@/lib/i18n/server";
import { generateHreflangTags } from "@/lib/hreflang";
import Script from "next/script";
import {
  WithContext,
  AboutPage,
  Organization,
  BreadcrumbList,
} from "schema-dts"; // Import schema types

const PAGE_SLUG = "author";
const PAGE_PATH = "/author";
const BASE_URL =
  process.env.NEXT_PUBLIC_PUBLIC_APP_URL || "http://localhost:3000";

async function getPageContent() {
  try {
    const response = await axios.get(`${BASE_URL}/api/pages/${PAGE_SLUG}`);
    return response.data;
  } catch (error) {
    return null;
  }
}

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getI18n(locale);
  const title = t("author_default_page_title");
  const description = t("author_default_page_description");
  const hreflangAlternates = await generateHreflangTags(PAGE_PATH, "", locale);

  return {
    title: title,
    description: description,
    alternates: hreflangAlternates,
  };
}

export default async function AuthorPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = await getI18n(locale);
  const pageContent = await getPageContent();

  if (!pageContent || !pageContent.content) {
    notFound();
  }

  const pageDescription = t("author_default_page_description");

  // --- ENHANCED JSON-LD STRUCTURED DATA ---
  const jsonLd: WithContext<AboutPage | BreadcrumbList>[] = [
    {
      "@context": "https://schema.org",
      "@type": "AboutPage",
      mainEntity: {
        "@type": "Organization",
        name: "Fan Skor",
        url: BASE_URL,
        logo: `${BASE_URL}/fanskor-transparent.webp`,
      },
      name: pageContent.title,
      description: pageDescription,
      url: `${BASE_URL}/${locale}${PAGE_PATH}`,
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: t("homepage"),
          item: `${BASE_URL}/${locale}`,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: pageContent.title,
        },
      ],
    },
  ];

  return (
    <>
      <Script
        id="author-page-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="container mx-auto flex-1 w-full lg:grid lg:grid-cols-[288px_1fr_288px] lg:gap-8 lg:items-start p-4 lg:p-0 lg:py-6">
          <Sidebar />

          <main className="min-w-0">
            <div className="bg-brand-secondary p-6 rounded-lg shadow-xl">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-purple-500/10 rounded-lg">
                  <UserCircle className="w-8 h-8 text-purple-400" />
                </div>
                <h1 className="text-4xl font-extrabold text-white">
                  {pageContent.title}
                </h1>
              </div>

              <div
                className="prose prose-invert lg:prose-xl max-w-none text-text-secondary"
                dangerouslySetInnerHTML={{ __html: pageContent.content }}
              />
            </div>
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
