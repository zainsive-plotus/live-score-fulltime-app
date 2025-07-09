// src/app/author/page.tsx
import type { Metadata } from "next";
import axios from "axios";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import { UserCircle } from "lucide-react";
import CasinoPartnerWidget from "@/components/CasinoPartnerWidget";
import AdSlotWidget from "@/components/AdSlotWidget";
import RecentNewsWidget from "@/components/RecentNewsWidget";

const PAGE_SLUG = "author";

// --- Server-side data fetching function ---
async function getPageContent() {
  try {
    const response = await axios.get(
      `${process.env.NEXT_PUBLIC_PUBLIC_APP_URL}/api/pages/${PAGE_SLUG}`
    );
    return response.data;
  } catch (error) {
    console.error(`[Page/${PAGE_SLUG}] Failed to fetch page content:`, error);
    return null;
  }
}

// --- Dynamic SEO Metadata ---
export async function generateMetadata(): Promise<Metadata> {
  const pageContent = await getPageContent();

  if (!pageContent || !pageContent.title) {
    return {
      title: "Uzman Yazarımız",
      description:
        "Uzman yazarımızla Fanskor'da tanışın, içgörülü spor makaleleri, tahminler ve analizler sunuyor.",
    };
  }

  return {
    title: `${pageContent.title} | Fanskor`,
    description: pageContent.content
      .replace(/<[^>]*>?/gm, "")
      .substring(0, 160),
    alternates: {
      canonical: `/${PAGE_SLUG}`,
    },
  };
}

// --- The Main Page Component ---
export default async function AuthorPage() {
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
              <div className="p-3 bg-purple-500/10 rounded-lg">
                <UserCircle className="w-8 h-8 text-purple-400" />
              </div>
              <h1 className="text-4xl font-extrabold text-white">
                {pageContent.title}
              </h1>
            </div>

            {/* Render the HTML content from the database */}
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
