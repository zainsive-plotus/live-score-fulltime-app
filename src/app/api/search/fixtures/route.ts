// src/app/api/search/fixtures/route.ts
import { NextResponse } from "next/server";
import axios from "axios";
import { format, addDays } from "date-fns";

// Reusable helper for making API-Football requests
const apiRequest = async (endpoint: string, params: object): Promise<any[]> => {
  const options = {
    method: "GET",
    url: `${process.env.NEXT_PUBLIC_API_FOOTBALL_HOST}/${endpoint}`,
    params,
    headers: { "x-apisports-key": process.env.NEXT_PUBLIC_API_FOOTBALL_KEY },
    timeout: 8000,
  };
  try {
    const response = await axios.request(options);
    return response.data.response;
  } catch (error: any) {
    console.error(
      `[API Search Helper] Error fetching '${endpoint}' with params ${JSON.stringify(
        params
      )}:`,
      error.message
    );
    return []; // Return empty array on error to not break the search
  }
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");

  if (!query || query.length < 3) {
    return NextResponse.json(
      { error: "A search query with at least 3 characters is required." },
      { status: 400 }
    );
  }

  const season = new Date().getFullYear().toString();
  const fromDate = format(new Date(), "yyyy-MM-dd");
  const toDate = format(addDays(new Date(), 30), "yyyy-MM-dd");

  try {
    // --- NEW LOGIC: Step 1 - Find Team and League IDs ---
    const [teamResults, leagueResults] = await Promise.all([
      apiRequest("teams", { search: query }),
      apiRequest("leagues", { search: query }),
    ]);

    const teamIds = teamResults.map((t: any) => t.team.id);
    const leagueIds = leagueResults.map((l: any) => l.league.id);

    if (teamIds.length === 0 && leagueIds.length === 0) {
      // If no teams or leagues match the search, return empty array immediately
      return NextResponse.json([]);
    }

    // --- NEW LOGIC: Step 2 - Fetch Fixtures for all found IDs ---
    const fixturePromises: Promise<any[]>[] = [];

    // Create promises to fetch fixtures for each found team
    teamIds.forEach((teamId) => {
      fixturePromises.push(
        apiRequest("fixtures", {
          team: teamId,
          season: season,
          from: fromDate,
          to: toDate,
        })
      );
    });

    // Create promises to fetch fixtures for each found league
    leagueIds.forEach((leagueId) => {
      fixturePromises.push(
        apiRequest("fixtures", {
          league: leagueId,
          season: season,
          from: fromDate,
          to: toDate,
        })
      );
    });

    const allFixtureResponses = await Promise.all(fixturePromises);
    const allFixtures = allFixtureResponses.flat();

    // --- Step 3: De-duplicate and Sort ---
    // A match might be found via its league AND its team, so we must de-duplicate
    const uniqueFixtures = Array.from(
      new Map(allFixtures.map((m) => [m.fixture.id, m])).values()
    );

    // Sort the final results by date
    uniqueFixtures.sort((a, b) => a.fixture.timestamp - b.fixture.timestamp);

    return NextResponse.json(uniqueFixtures);
  } catch (error: any) {
    console.error(
      `[API Search] Critical error for query "${query}":`,
      error.message
    );
    return NextResponse.json(
      { error: "Failed to fetch search results." },
      { status: 500 }
    );
  }
}
