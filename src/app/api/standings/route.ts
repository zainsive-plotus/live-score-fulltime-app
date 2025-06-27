// src/app/api/standings/route.ts

import { NextResponse } from "next/server";
import axios from "axios";
import { generateLeagueSlug } from "@/lib/generate-league-slug"; // <-- IMPORT

// TeamStanding type definition remains the same
type TeamStanding = {
  rank: number;
  team: { id: number; name: string; logo: string };
  points: number;
  goalsDiff: number;
  all: { played: number; win: number; draw: number; lose: number };
  description: string | null;
  group: string; // <-- Make sure group is part of the type
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const leagueId = searchParams.get("league");
  const season =
    searchParams.get("season") || new Date().getFullYear().toString();

  if (!leagueId) {
    return NextResponse.json(
      { error: "League ID is required" },
      { status: 400 }
    );
  }

  const options = {
    method: "GET",
    url: `${process.env.NEXT_PUBLIC_API_FOOTBALL_HOST}/standings`,
    params: { league: leagueId, season: season },
    headers: {
      "x-apisports-key": process.env.NEXT_PUBLIC_API_FOOTBALL_KEY,
    },
  };

  try {
    const response = await axios.request(options);
    if (!response.data.response || response.data.response.length === 0) {
      return NextResponse.json({ league: null, standings: [] });
    }

    const data = response.data.response[0];

    // --- ENHANCED TRANSFORMATION ---
    // We now add the href to the league info object
    const leagueInfo = {
      id: data.league.id,
      name: data.league.name,
      logo: data.league.logo,
      type: data.league.type, // Good to have for context
      href: generateLeagueSlug(data.league.name, data.league.id), // <-- ADD THE HREF
    };

    // Ensure we are selecting the correct standings array
    const standings: TeamStanding[][] = data.league.standings;

    return NextResponse.json({ league: leagueInfo, standings });
  } catch (error) {
    console.error("Error fetching standings:", error);
    return NextResponse.json(
      { error: "Failed to fetch standings data" },
      { status: 500 }
    );
  }
}
