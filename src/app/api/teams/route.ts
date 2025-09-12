// ===== src/app/api/teams/route.ts =====

import { NextResponse } from "next/server";
import axios from "axios";
import redis from "@/lib/redis"; // <-- Import Redis

// --- CORE CHANGE: Set cache TTL to 24 hours ---
const CACHE_TTL_SECONDS = 60 * 60 * 24; // 24 hours

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const leagueId = searchParams.get("league");
  const season = searchParams.get("season");

  if (!leagueId || !season) {
    return NextResponse.json(
      { error: "League ID and season are required" },
      { status: 400 }
    );
  }

  // --- CORE CHANGE: Implement Redis caching ---
  const cacheKey = `teams:league:v1:${leagueId}:${season}`;

  try {
    const cachedData = await redis.get(cacheKey);
    if (cachedData) {
      console.log(`[API/teams] Cache HIT for key: ${cacheKey}`);
      return NextResponse.json(JSON.parse(cachedData));
    }

    console.log(
      `[API/teams] Cache MISS for key: ${cacheKey}. Fetching from API.`
    );

    const options = {
      method: "GET",
      url: `${process.env.NEXT_PUBLIC_API_FOOTBALL_HOST}/teams`,
      params: {
        league: leagueId,
        season: season,
      },
      headers: {
        "x-apisports-key": process.env.NEXT_PUBLIC_API_FOOTBALL_KEY,
      },
    };

    const response = await axios.request(options);
    const teamsData = response.data.response;

    if (teamsData && teamsData.length > 0) {
      await redis.set(
        cacheKey,
        JSON.stringify(teamsData),
        "EX",
        CACHE_TTL_SECONDS
      );
    }

    return NextResponse.json(teamsData);
  } catch (error) {
    console.error(
      `[API/teams] Error fetching data for league ${leagueId}:`,
      error
    );
    return NextResponse.json(
      { error: "Failed to fetch teams data." },
      { status: 500 }
    );
  }
}
