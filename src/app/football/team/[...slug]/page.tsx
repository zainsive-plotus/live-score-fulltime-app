// src/app/football/team/[...slug]/page.tsx
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import TeamDetailView from "@/components/TeamDetailView";
import { notFound } from "next/navigation";
import axios from "axios";
import type { Metadata } from "next"; // <-- NEW IMPORT for Metadata

// Helper to extract the ID from the slug (unchanged)
const getTeamIdFromSlug = (slug: string): string | null => {
  if (!slug) return null;
  const parts = slug.split("-");
  const lastPart = parts[parts.length - 1];
  return /^\d+$/.test(lastPart) ? lastPart : null;
};

// --- THIS IS THE CORRECTED DATA FETCHING FUNCTION ---
async function getTeamData(teamId: string) {
  const season = new Date().getFullYear();

  // Reusable options object for axios requests
  const options = (endpoint: string, params: object) => ({
    method: "GET",
    url: `${process.env.NEXT_PUBLIC_API_FOOTBALL_HOST}/${endpoint}`,
    params,
    headers: { "x-apisports-key": process.env.NEXT_PUBLIC_API_FOOTBALL_KEY },
  });

  try {
    const [teamInfoRes, squadRes, fixturesRes] = await Promise.all([
      axios.request(options("teams", { id: teamId })),
      axios.request(options("players/squads", { team: teamId })),
      axios.request(
        options("fixtures", { team: teamId, season: season, last: 50 })
      ),
    ]);

    if (!teamInfoRes.data.response[0]) {
      return null;
    }

    return {
      teamInfo: teamInfoRes.data.response[0],
      squad: squadRes.data.response[0]?.players || [],
      fixtures: fixturesRes.data.response || [],
    };
  } catch (error) {
    console.error(`Failed to fetch team details for teamId ${teamId}:`, error);
    return null;
  }
}

// --- generateMetadata function ---
export async function generateMetadata({
  params,
}: {
  params: { slug: string[] };
}): Promise<Metadata> {
  // Specify Metadata return type
  // --- THE FIX IS HERE: AWAIT params ---
  const awaitedParams = await params; // Await the params object
  const slug = awaitedParams.slug.join("/");
  const teamId = getTeamIdFromSlug(slug);

  if (!teamId) {
    return { title: "Team Not Found" };
  }

  try {
    const { data } = await axios.get(
      `${process.env.NEXT_PUBLIC_API_FOOTBALL_HOST}/teams?id=${teamId}`,
      {
        headers: {
          "x-apisports-key": process.env.NEXT_PUBLIC_API_FOOTBALL_KEY,
        },
      }
    );
    const teamInfo = data.response[0];
    if (!teamInfo) return { title: "Team Not Found" };

    const pageTitle = `${teamInfo.team.name} - Squad, Fixtures & Standings`;
    const pageDescription = `View the full squad, recent fixtures, and current standings for ${teamInfo.team.name}.`;
    const canonicalUrl = `/football/team/${slug}`;

    return {
      title: pageTitle,
      description: pageDescription,
      alternates: {
        canonical: canonicalUrl,
      },
      openGraph: {
        title: pageTitle,
        description: pageDescription,
        // images: [`${process.env.NEXT_PUBLIC_PUBLIC_APP_URL}/api/image-proxy?url=${encodeURIComponent(teamInfo.team.logo)}`],
      },
      twitter: {
        card: "summary_large_image",
        title: pageTitle,
        description: pageDescription,
        // images: [`${process.env.NEXT_PUBLIC_PUBLIC_APP_URL}/api/image-proxy?url=${encodeURIComponent(teamInfo.team.logo)}`],
      },
    };
  } catch {
    return { title: "Team Not Found" };
  }
}

// THE MAIN PAGE COMPONENT
export default async function TeamPage({
  params,
}: {
  params: { slug: string[] };
}) {
  // --- THE FIX IS HERE: AWAIT params ---
  const awaitedParams = await params; // Await the params object
  const slug = awaitedParams.slug.join("/");
  const teamId = getTeamIdFromSlug(slug);

  if (!teamId) {
    notFound();
  }

  const teamData = await getTeamData(teamId);

  if (!teamData) {
    notFound();
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="container mx-auto flex-1 w-full lg:grid lg:grid-cols-[288px_1fr] lg:gap-8 lg:items-start">
        <Sidebar />
        <main className="min-w-0 p-4 lg:p-0 lg:py-6">
          <TeamDetailView teamData={teamData} />
        </main>
      </div>
    </div>
  );
}
