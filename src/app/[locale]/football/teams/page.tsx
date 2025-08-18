// ===== src/app/[locale]/football/teams/page.tsx =====

import type { Metadata } from "next";
import axios from "axios";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import TeamListClient from "@/components/TeamListClient";
import RecentNewsWidget from "@/components/RecentNewsWidget";
import AdSlotWidget from "@/components/AdSlotWidget";
import { Users } from "lucide-react";
import { getI18n } from "@/lib/i18n/server";
import { generateHreflangTags } from "@/lib/hreflang";

const PAGE_PATH = "/football/teams";
const ITEMS_PER_PAGE = 21;

// CHANGE: This function now fetches the first page of data from your new DB-backed API
const fetchInitialTeams = async () => {
  const publicAppUrl = process.env.NEXT_PUBLIC_PUBLIC_APP_URL;
  if (!publicAppUrl) {
    console.error(
      "[Teams Page Server] NEXT_PUBLIC_PUBLIC_APP_URL is not defined."
    );
    return {
      teams: [],
      pagination: { currentPage: 1, totalPages: 0, totalCount: 0 },
    };
  }

  const apiUrl = `${publicAppUrl}/api/teams/paginated?page=1&limit=${ITEMS_PER_PAGE}`;

  try {
    const { data } = await axios.get(apiUrl, { timeout: 15000 });
    return data;
  } catch (error: any) {
    console.error(
      `[Teams Page Server] Failed to fetch initial teams (${apiUrl}):`,
      error.message
    );
    return {
      teams: [],
      pagination: { currentPage: 1, totalPages: 0, totalCount: 0 },
    };
  }
};

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const { locale } = params;

  const t = await getI18n(locale);
  const hreflangAlternates = await generateHreflangTags(PAGE_PATH, "", locale);

  const pageTitle = t("teams_page_meta_title");
  const pageDescription = t("teams_page_meta_description");

  return {
    title: pageTitle,
    description: pageDescription,
    alternates: hreflangAlternates,
  };
}

export default async function TeamsPage({
  params,
}: {
  params: { locale: string };
}) {
  const { locale } = params;

  const initialData = await fetchInitialTeams();
  const t = await getI18n(locale);

  const seoDescription = t("teams_page_seo_text");

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="container mx-auto flex-1 w-full lg:grid lg:grid-cols-[288px_1fr_288px] lg:gap-8 lg:items-start p-4 lg:p-0 lg:py-6">
        <Sidebar />

        <main className="min-w-0">
          <div className="bg-brand-secondary p-6 rounded-lg shadow-xl mb-8">
            <div className="flex items-center gap-4 mb-3">
              <div className="p-3 bg-[var(--brand-accent)]/10 rounded-lg">
                <Users className="w-8 h-8 text-[var(--brand-accent)]" />
              </div>
              <div>
                <h1 className="text-4xl font-extrabold text-white">
                  {t("football_teams_title")}
                </h1>
                <p className="text-text-muted">
                  {t("football_teams_subtitle")}
                </p>
              </div>
            </div>
            <p className="italic text-[#a3a3a3] leading-relaxed text-sm mt-4">
              {seoDescription}
            </p>
          </div>

          {/* CHANGE: Pass the initial server-fetched data to the client component */}
          <TeamListClient initialData={initialData} />
        </main>

        <aside className="hidden lg:block lg:col-span-1 space-y-8 min-w-0">
          <RecentNewsWidget />
          <AdSlotWidget location="homepage_right_sidebar" />
        </aside>
      </div>
    </div>
  );
}
