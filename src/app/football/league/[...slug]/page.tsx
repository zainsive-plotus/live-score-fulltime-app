// src/app/football/league/[...slug]/page.tsx
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import LeagueDetailView from "@/components/league-detail-view";
import axios from "axios";
import { notFound } from "next/navigation";

// Helper to extract the ID from the slug (e.g., "premier-league-39" -> "39")
const getLeagueIdFromSlug = (slug: string): string | null => {
  if (!slug) return null;
  const parts = slug.split("-");
  const lastPart = parts[parts.length - 1];
  return /^\d+$/.test(lastPart) ? lastPart : null;
};

// The data fetching functions remain unchanged
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

    if (!data.response || data.response.length === 0) {
      return null;
    }

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
  const slug = params.slug.join("/");
  const leagueId = getLeagueIdFromSlug(slug);
  if (!leagueId) return { title: "League Not Found" };

  const leagueData = await getLeagueData(leagueId);
  if (!leagueData) return { title: "League Not Found" };

  return {
    title: `${leagueData.league.name} - Info, Fixtures & Standings`,
    description: `All information about the ${leagueData.league.name}, including available seasons, fixtures, and full standings.`,
  };
}

// --- THE MAIN PAGE COMPONENT ---
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
      <div className="container mx-auto flex-1 w-full lg:grid lg:grid-cols-[288px_1fr] lg:gap-8 lg:items-start">
        <Sidebar />
        <main className="min-w-0 p-4 lg:p-0 lg:py-6">
          <LeagueDetailView leagueData={leagueData} />
        </main>
      </div>
    </div>
  );
}
