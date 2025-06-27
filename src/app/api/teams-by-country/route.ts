// src/app/api/teams-by-country/route.ts
import { NextResponse } from "next/server";
import axios from "axios";

const season = new Date().getFullYear();

// This is a reusable helper for making requests to the external API
const apiRequest = async (endpoint: string, params: object) => {
  const options = {
    method: "GET",
    url: `${process.env.NEXT_PUBLIC_API_FOOTBALL_HOST}/${endpoint}`,
    params,
    headers: { "x-apisports-key": process.env.NEXT_PUBLIC_API_FOOTBALL_KEY },
  };
  const response = await axios.request(options);
  return response.data.response;
};

// This function now returns both the list of teams AND the count
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const country = searchParams.get("country");

  if (!country) {
    return NextResponse.json(
      { error: "Country parameter is required" },
      { status: 400 }
    );
  }

  try {
    // 1. First, find all leagues for the specified country.
    const leagues = await apiRequest("leagues", { country: country });
    if (!leagues || leagues.length === 0) {
      // Return a structured response even if there are no teams
      return NextResponse.json({ teams: [], count: 0 });
    }

    const leagueIds = leagues.map((l: any) => l.league.id);

    // 2. Fetch all teams from all found leagues in parallel.
    const teamPromises = leagueIds.map((id: any) =>
      apiRequest("teams", { league: id, season: season })
    );
    const responses = await Promise.allSettled(teamPromises);

    // 3. Aggregate all teams from successful requests.
    const allTeamsResponses = responses
      .filter((result) => result.status === "fulfilled" && result.value)
      .flatMap((result) => (result as PromiseFulfilledResult<any>).value);

    // 4. De-duplicate the teams using a Map (very important).
    const uniqueTeams = Array.from(
      new Map(allTeamsResponses.map((item) => [item.team.id, item])).values()
    );

    // 5. Sort the final list alphabetically.
    uniqueTeams.sort((a, b) => a.team.name.localeCompare(b.team.name));

    // 6. Return the enhanced response object
    return NextResponse.json({
      teams: uniqueTeams,
      count: uniqueTeams.length, // The accurate count of unique teams
    });
  } catch (error) {
    console.error(`Error fetching teams for country "${country}":`, error);
    return NextResponse.json(
      { error: "Failed to fetch teams data for this country." },
      { status: 500 }
    );
  }
}
