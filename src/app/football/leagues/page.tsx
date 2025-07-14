import type { Metadata } from "next";
import axios from "axios";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import LeagueListClient from "@/components/LeagueListClient";
import { League } from "@/types/api-football";

import RecentNewsWidget from "@/components/RecentNewsWidget";
import AdSlotWidget from "@/components/AdSlotWidget";
import { getI18n } from "@/lib/i18n/server"; // <-- Import server helper

export const dynamic = "force-dynamic";

const fetchAllLeaguesServer = async (): Promise<League[]> => {
  const publicAppUrl = process.env.NEXT_PUBLIC_PUBLIC_APP_URL;
  if (!publicAppUrl) {
    console.error(
      "[Leagues Page Server] NEXT_PUBLIC_PUBLIC_APP_URL is not defined! Cannot fetch all leagues."
    );
    return [];
  }
  const apiUrl = `${publicAppUrl}/api/leagues?fetchAll=true`;
  try {
    const { data } = await axios.get(apiUrl, { timeout: 15000 });
    return data;
  } catch (error: any) {
    console.error(
      `[Leagues Page Server] Failed to fetch all leagues (${apiUrl}):`,
      error.message
    );
    return [];
  }
};

export async function generateMetadata(): Promise<Metadata> {
  const t = await getI18n();
  // const pageTitle = t("all_leagues_page_title");
  const pageTitle = `Tüm Futbol Ligleri ve Kupalar | Favori Müsabakanızı Bulun`;
  const pageDescription = `Dünya genelindeki futbol ligleri ve kupalarının kapsamlı bir listesini keşfedin. En iyi ligler ve uluslararası müsabakalar için detaylı bilgi, puan durumu, fikstür ve daha fazlasını bulun.`;
  // const pageDescription = t("all_leagues_page_description");
  const canonicalUrl = `/football/leagues`;

  return {
    title: pageTitle,
    description: pageDescription,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: pageTitle,
      description: pageDescription,
      url: `${process.env.NEXT_PUBLIC_PUBLIC_APP_URL}/football/leagues`,
      siteName: "Fan Skor",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: pageTitle,
      description: pageDescription,
    },
  };
}

export default async function LeaguesPage() {
  const allLeagues = await fetchAllLeaguesServer();
  const t = await getI18n();

  const leaguesPageSeoText = t("leagues_page_seo_text");

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="container mx-auto flex-1 w-full lg:grid lg:grid-cols-[288px_1fr_288px] lg:gap-8 lg:items-start p-4 lg:p-0 lg:py-6">
        <Sidebar />
        <main className="min-w-0">
          <h1 className="text-4xl font-extrabold text-white mb-6">
            {t("leagues_and_cups_title")}
          </h1>
          <p className="italic text-[#a3a3a3] leading-relaxed mb-8">
            {leaguesPageSeoText}
          </p>
          {/* LeagueListClient will handle its own internal translations via its hook */}
          <LeagueListClient initialAllLeagues={allLeagues} />
        </main>
        <aside className="hidden lg:block lg:col-span-1 space-y-8 min-w-0">
          <RecentNewsWidget />
          <AdSlotWidget location="homepage_right_sidebar" />
        </aside>
      </div>
    </div>
  );
}
