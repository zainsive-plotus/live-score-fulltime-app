// src/app/football/leagues/page.tsx
import type { Metadata } from "next";
import axios from "axios";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import LeagueListClient from "@/components/LeagueListClient";
import { League } from "@/types/api-football";
// --- NEW WIDGET IMPORTS ---
import CasinoPartnerWidget from "@/components/CasinoPartnerWidget";
import RecentNewsWidget from "@/components/RecentNewsWidget";
import AdSlotWidget from "@/components/AdSlotWidget";

export const dynamic = "force-dynamic";

// --- Server-side Data Fetching (Unchanged) ---
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

// --- Metadata Generation (Unchanged) ---
export async function generateMetadata(): Promise<Metadata> {
  const pageTitle =
    "All Football Leagues & Cups | Find Your Favorite Competition";
  const pageDescription =
    "Explore a comprehensive list of football leagues and cups from around the world. Find detailed information, standings, fixtures, and more for top divisions and international competitions.";
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

// --- MAIN PAGE COMPONENT (WITH ENHANCED LAYOUT) ---
export default async function LeaguesPage() {
  const allLeagues = await fetchAllLeaguesServer();

  const leaguesPageSeoText = `Futbol dünyasının kalbine hoş geldiniz! Bu sayfada, en heyecan verici yerel liglerden prestijli uluslararası kupalara kadar, dünya genelindeki tüm futbol liglerini ve kupalarını keşfedebilirsiniz. Takımların güncel sıralamalarını, yaklaşan fikstürlerini ve tarihi istatistiklerini kolayca bulun. En sevdiğiniz ligin detaylı analizlerine dalın ve futbolun nabzını tutun.`;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      {/* --- THIS IS THE FIX: The new 3-column grid layout --- */}
      <div className="container mx-auto flex-1 w-full lg:grid lg:grid-cols-[288px_1fr_288px] lg:gap-8 lg:items-start p-4 lg:p-0 lg:py-6">
        <Sidebar />

        <main className="min-w-0">
          <h1 className="text-4xl font-extrabold text-white mb-6">
            Ligler ve Kupalar
          </h1>
          <p className="italic text-[#a3a3a3] leading-relaxed mb-8">
            {leaguesPageSeoText}
          </p>
          <LeagueListClient initialAllLeagues={allLeagues} />
        </main>

        {/* --- NEW: Right Sidebar Column --- */}
        <aside className="hidden lg:block lg:col-span-1 space-y-8 min-w-0">
          {/* <CasinoPartnerWidget /> */}
          <RecentNewsWidget />
          <AdSlotWidget location="homepage_right_sidebar" />
        </aside>
      </div>
    </div>
  );
}
