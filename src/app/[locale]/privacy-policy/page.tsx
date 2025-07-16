import type { Metadata } from "next";
import axios from "axios";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import { Shield } from "lucide-react";
import RecentNewsWidget from "@/components/RecentNewsWidget";
import AdSlotWidget from "@/components/AdSlotWidget";
import { getI18n } from "@/lib/i18n/server";
import { generateHreflangTags } from "@/lib/hreflang";

const PAGE_SLUG = "privacy-policy";
const PAGE_PATH = "/privacy-policy";

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
  const hreflangAlternates = await generateHreflangTags(PAGE_PATH, locale);

  const title = t("privacy_policy_default_page_title");
  const description = t("privacy_policy_default_page_description");

  return {
    title: title,
    description: description,
    alternates: hreflangAlternates,
  };
}

export default async function PrivacyPolicyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
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
              <div className="p-3 bg-blue-500/10 rounded-lg">
                <Shield className="w-8 h-8 text-blue-400" />
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
