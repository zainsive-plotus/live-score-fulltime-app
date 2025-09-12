// ===== src/app/api/league-page-data/route.ts =====

import { NextResponse } from "next/server";
import { getLeaguePageData } from "@/lib/data/league";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const leagueId = searchParams.get("leagueId");
  // --- CORE CHANGE: Read the season parameter ---
  const season = searchParams.get("season");

  if (!leagueId) {
    return NextResponse.json(
      { error: "League ID is required" },
      { status: 400 }
    );
  }

  // A season is also required for correct data fetching
  if (!season) {
    return NextResponse.json({ error: "Season is required" }, { status: 400 });
  }

  try {
    // --- CORE CHANGE: Pass the season to the data fetcher ---
    const leagueData = await getLeaguePageData(leagueId, season);

    if (!leagueData) {
      return NextResponse.json(
        { error: "League data not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(leagueData);
  } catch (error) {
    console.error(
      `[API/league-page-data] Error fetching data for league ${leagueId}:`,
      error
    );
    return NextResponse.json(
      { error: "Failed to fetch league page data" },
      { status: 500 }
    );
  }
}
