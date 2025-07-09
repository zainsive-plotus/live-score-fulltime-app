// src/app/report-abuse/page.tsx
import type { Metadata } from "next";
import axios from "axios";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import { AlertTriangle } from "lucide-react";
import CasinoPartnerWidget from "@/components/CasinoPartnerWidget";

const PAGE_SLUG = "report-abuse";

// --- Server-side data fetching function ---
async function getPageContent() {
  try {
    const response = await axios.get(
      `${process.env.NEXT_PUBLIC_PUBLIC_APP_URL}/api/pages/${PAGE_SLUG}`
    );
    return response.data;
  } catch (error) {
    console.error(`[Page/${PAGE_SLUG}] Failed to fetch page content:`, error);
    return null; // Return null on error to handle it gracefully
  }
}

// --- Dynamic SEO Metadata ---
export async function generateMetadata(): Promise<Metadata> {
  const pageContent = await getPageContent();

  // Provide default metadata if the page content isn't found
  if (!pageContent || !pageContent.title) {
    return {
      title: "İstismarı Bildir | Fan Skor Güvenliği",
      description:
        "Fan Skor’da bir sorun mu yaşadınız? Hemen İstismarı Bildir ve bize yardımcı olun!",
    };
  }

  return {
    title: `${pageContent.title}`,
    description: pageContent.content
      .replace(/<[^>]*>?/gm, "")
      .substring(0, 160),
    alternates: {
      canonical: `/${PAGE_SLUG}`,
    },
  };
}

// --- The Main Page Component ---
export default async function ReportAbusePage() {
  const pageContent = await getPageContent();

  // If no content is found in the database for this slug, show a 404 page.
  if (!pageContent) {
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
              <div className="p-3 bg-red-500/10 rounded-lg">
                <AlertTriangle className="w-8 h-8 text-red-400" />
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
          {/* <CasinoPartnerWidget /> */}
          <RecentNewsWidget />
          <AdSlotWidget location="homepage_right_sidebar" />
        </aside>
      </div>
    </div>
  );
}
