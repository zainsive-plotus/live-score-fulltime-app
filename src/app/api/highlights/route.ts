// ===== src/app/api/highlights/route.ts =====

import { NextResponse } from "next/server";
import axios from "axios"; // Still needed for the primary sports API
import { getMatchHighlights } from "@/lib/data/highlightly";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const fixtureId = searchParams.get("fixtureId");

  if (!fixtureId) {
    return NextResponse.json(
      { error: "Fixture ID is required" },
      { status: 400 }
    );
  }

  try {
    // Fetch fixture data from the primary sports API to get names
    const sportsApiUrl = `${process.env.NEXT_PUBLIC_API_FOOTBALL_HOST}/fixtures?id=${fixtureId}`;
    const sportsApiResponse = await axios.get(sportsApiUrl, {
      headers: { "x-apisports-key": process.env.NEXT_PUBLIC_API_FOOTBALL_KEY },
    });

    const fixtureData = sportsApiResponse.data.response[0];
    if (!fixtureData) {
      return NextResponse.json(
        { error: "Fixture data not found." },
        { status: 404 }
      );
    }

    const { league, teams } = fixtureData;

    // Construct parameters for our service function
    const highlightlyParams = {
      leagueName: league.name,
      homeTeamName: teams.home.name,
      awayTeamName: teams.away.name,
      limit: 40,
    };

    // Use the centralized service to call the Highlightly API
    const highlightsData = await getMatchHighlights(highlightlyParams);

    const headers = new Headers();
    headers.set(
      "Cache-Control",
      "public, s-maxage=600, stale-while-revalidate=1200"
    );

    let finalData = { highlights: highlightsData.data ?? [] };

    // if (highlightsData && Array.isArray(highlightsData.data)) {
    //   const filteredHighlights = highlightsData.data.filter(
    //     (h: any) => h.match?.id?.toString() === fixtureId
    //   );
    //   finalData = { highlights: filteredHighlights };
    // }

    return NextResponse.json(finalData, { status: 200, headers });
  } catch (error: any) {
    console.error(
      `[API/highlights] Error processing highlights for fixture ${fixtureId}:`,
      error.message
    );

    return NextResponse.json(
      { error: "Failed to fetch highlights from the provider." },
      { status: 502 }
    );
  }
}
