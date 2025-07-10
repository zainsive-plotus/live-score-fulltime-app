// src/app/football/league/[...slug]/page.tsx
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import LeagueDetailView from "@/components/league-detail-view";
import axios from "axios";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
// --- NEW WIDGET IMPORTS FOR THE SIDEBAR ---
import CasinoPartnerWidget from "@/components/CasinoPartnerWidget";
import RecentNewsWidget from "@/components/RecentNewsWidget";
import AdSlotWidget from "@/components/AdSlotWidget";

// Helper and data fetching functions (unchanged)
const getLeagueIdFromSlug = (slug: string): string | null => {
  if (!slug) return null;
  const parts = slug.split("-");
  const lastPart = parts[parts.length - 1];
  return /^\d+$/.test(lastPart) ? lastPart : null;
};
async function getLeagueData(leagueId: string): Promise<any | null> {
  try {
    const { data } = await axios.get(
      `${process.env.NEXT_PUBLIC_API_FOOTBALL_HOST}/leagues?id=${leagueId}`,
      {
        headers: {
          "x-apisports-key": process.env.NEXT_PUBLIC_API_FOOTBALL_KEY,
        },
      }
    );
    if (!data.response || data.response.length === 0) return null;
    const leagueData = data.response[0];
    const standingsResponse = await axios.get(
      `${process.env.NEXT_PUBLIC_API_FOOTBALL_HOST}/standings`,
      {
        params: { league: leagueId, season: new Date().getFullYear() },
        headers: {
          "x-apisports-key": process.env.NEXT_PUBLIC_API_FOOTBALL_KEY,
        },
      }
    );
    leagueData.league.standings =
      standingsResponse.data.response[0]?.league?.standings || [];
    return leagueData;
  } catch (error) {
    console.error("Failed to fetch single league data:", error);
    return null;
  }
}
export async function generateMetadata({
  params,
}: {
  params: { slug: string[] };
}) {
  /* ... unchanged ... */
}

// --- THE MAIN PAGE COMPONENT (WITH ENHANCED 3-COLUMN LAYOUT) ---
export default async function LeaguePage({
  params,
}: {
  params: { slug: string[] };
}) {
  const slug = params.slug.join("/");
  const leagueId = getLeagueIdFromSlug(slug);
  if (!leagueId) {
    notFound();
  }

  const leagueData = await getLeagueData(leagueId);
  if (!leagueData) {
    notFound();
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      {/* --- THIS IS THE FIX: The new 3-column grid layout --- */}
      <div className="container mx-auto flex-1 w-full lg:grid lg:grid-cols-[288px_1fr_288px] lg:gap-8 lg:items-start p-4 lg:p-0 lg:py-6">
        <Sidebar />

        <main className="min-w-0">
          <LeagueDetailView leagueData={leagueData} />
        </main>

        {/* --- NEW: Right Sidebar Column --- */}
        <aside className="hidden lg:block lg:col-span-1 space-y-8 min-w-0">
          <RecentNewsWidget />
          {/* <CasinoPartnerWidget /> */}
          <AdSlotWidget location="homepage_right_sidebar" />
        </aside>
      </div>
    </div>
  );
}
