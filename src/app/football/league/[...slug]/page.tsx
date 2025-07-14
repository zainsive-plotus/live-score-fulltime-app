import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import LeagueDetailView from "@/components/league-detail-view";
import axios from "axios";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import RecentNewsWidget from "@/components/RecentNewsWidget";
import AdSlotWidget from "@/components/AdSlotWidget";
import { getI18n } from "@/lib/i18n/server"; // <-- Import server helper

// Helper function to extract ID from slug
const getLeagueIdFromSlug = (slug: string): string | null => {
  if (!slug) return null;
  const parts = slug.split("-");
  const lastPart = parts[parts.length - 1];
  return /^\d+$/.test(lastPart) ? lastPart : null;
};

// Server-side data fetching for the league
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

    // Fetch standings only if it's a league
    if (leagueData.league.type === "League") {
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
    } else {
      leagueData.league.standings = [];
    }
    return leagueData;
  } catch (error) {
    console.error(`Failed to fetch league data for ID ${leagueId}:`, error);
    return null;
  }
}

// Dynamic Metadata Generation (Server-Side)
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}): Promise<Metadata> {
  const t = await getI18n();
  const slug = (await params).slug.join("/");
  const leagueId = getLeagueIdFromSlug(slug);

  if (!leagueId) {
    return { title: t("not_found_title") };
  }

  const leagueData = await getLeagueData(leagueId);

  if (!leagueData) {
    return { title: t("not_found_title") };
  }

  const { league, country } = leagueData;
  const pageTitle = t("league_page_title", {
    leagueName: league.name,
    countryName: country.name,
  });
  const pageDescription = t("league_page_description", {
    leagueName: league.name,
    countryName: country.name,
  });

  return {
    title: pageTitle,
    description: pageDescription,
    alternates: {
      canonical: `/football/league/${slug}`,
    },
  };
}

// The Page Component (Server Component)
export default async function LeaguePage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const slug = (await params).slug.join("/");
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
      <div className="container mx-auto flex-1 w-full lg:grid lg:grid-cols-[288px_1fr_288px] lg:gap-8 lg:items-start p-4 lg:p-0 lg:py-6">
        <Sidebar />
        <main className="min-w-0">
          <LeagueDetailView leagueData={leagueData} />
        </main>
        <aside className="hidden lg:block lg:col-span-1 space-y-8 min-w-0">
          <RecentNewsWidget />
          <AdSlotWidget location="homepage_right_sidebar" />
        </aside>
      </div>
    </div>
  );
}
