import type { Metadata } from "next";
import axios from "axios";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import { DatabaseZap } from "lucide-react";
import AdSlotWidget from "@/components/AdSlotWidget";
import RecentNewsWidget from "@/components/RecentNewsWidget";
import { getI18n } from "@/lib/i18n/server";
import { generateHreflangTags } from "@/lib/hreflang";

const PAGE_SLUG = "gdpr";
const PAGE_PATH = "/gdpr";

async function getPageContent() {
  try {
    const response = await axios.get(
      `${process.env.NEXT_PUBLIC_PUBLIC_APP_URL}/api/pages/${PAGE_SLUG}`
    );
    return response.data;
  } catch (error) {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  const t = await getI18n(locale);
  const pageContent = await getPageContent();
  const hreflangAlternates = await generateHreflangTags(PAGE_PATH, locale);

  const title = pageContent?.title
    ? t("dynamic_page_title", { title: pageContent.title })
    : t("gdpr_default_page_title");

  const description = pageContent?.content
    ? pageContent.content.replace(/<[^>]*>?/gm, "").substring(0, 160)
    : t("gdpr_default_page_description");

  return {
    title: title,
    description: description,
    alternates: hreflangAlternates,
  };
}

export default async function GdprPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const pageContent = await getPageContent();

  if (!pageContent || !pageContent.content) {
    notFound();
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="container mx-auto flex-1 w-full lg:grid lg:grid-cols-[288px_1fr_288px] lg:gap-8 lg:items-start p-4 lg:p-0 lg:py-6">
        <Sidebar />

        <main className="min-w-0">
          <div className="bg-brand-secondary p-6 rounded-lg shadow-xl">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-indigo-500/10 rounded-lg">
                <DatabaseZap className="w-8 h-8 text-indigo-400" />
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
  );
}
