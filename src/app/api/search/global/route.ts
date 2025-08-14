// ===== src/app/api/search/global/route.ts =====

import { NextResponse } from "next/server";
import axios from "axios";
import { generateLeagueSlug } from "@/lib/generate-league-slug";
import { generateTeamSlug } from "@/lib/generate-team-slug";

const apiRequest = async (endpoint: string, params: object): Promise<any[]> => {
  const options = {
    method: "GET",
    url: `${process.env.NEXT_PUBLIC_API_FOOTBALL_HOST}/${endpoint}`,
    params,
    headers: { "x-apisports-key": process.env.NEXT_PUBLIC_API_FOOTBALL_KEY },
    timeout: 5000,
  };
  try {
    const response = await axios.request(options);
    return response.data.response;
  } catch (error) {
    console.error(`[Global Search API] Error fetching '${endpoint}':`, error);
    return [];
  }
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");

  if (!query || query.length < 3) {
    return NextResponse.json(
      { error: "A search query of at least 3 characters is required." },
      { status: 400 }
    );
  }

  try {
    const [teamResults, leagueResults] = await Promise.all([
      apiRequest("teams", { search: query }),
      apiRequest("leagues", { search: query }),
    ]);

    const teams = teamResults.slice(0, 5).map((t: any) => ({
      id: t.team.id,
      name: t.team.name,
      logo: t.team.logo,
      country: t.team.country,
      href: generateTeamSlug(t.team.name, t.team.id),
    }));

    const leagues = leagueResults.slice(0, 5).map((l: any) => ({
      id: l.league.id,
      name: l.league.name,
      logo: l.league.logo,
      country: l.country.name,
      href: generateLeagueSlug(l.league.name, l.league.id),
    }));

    return NextResponse.json({ teams, leagues });
  } catch (error) {
    console.error(
      `[Global Search API] Critical error for query "${query}":`,
      error
    );
    return NextResponse.json(
      { error: "Failed to fetch search results." },
      { status: 500 }
    );
  }
}
