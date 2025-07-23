// ===== src/app/api/standings/route.ts (Redis Enhanced) =====

import { NextResponse } from "next/server";
import axios from "axios";
import { generateLeagueSlug } from "@/lib/generate-league-slug";
import redis from "@/lib/redis"; // <-- 1. Import Redis client

const CACHE_TTL_SECONDS = 60 * 60 * 2; // Cache standings for 2 hours

type TeamStanding = {
  rank: number;
  team: { id: number; name: string; logo: string };
  points: number;
  goalsDiff: number;
  all: { played: number; win: number; draw: number; lose: number };
  description: string | null;
  group: string;
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

  // 2. Create a unique cache key for this specific league and season
  const cacheKey = `standings:${leagueId}:${season}`;

  try {
    // 3. Check Redis first
    const cachedData = await redis.get(cacheKey);
    if (cachedData) {
      console.log(`[Cache HIT] Returning cached data for key: ${cacheKey}`);
      return NextResponse.json(JSON.parse(cachedData));
    }

    // 4. Cache Miss: Fetch fresh data
    console.log(`[Cache MISS] Fetching fresh data for key: ${cacheKey}`);
    const options = {
      method: "GET",
      url: `${process.env.NEXT_PUBLIC_API_FOOTBALL_HOST}/standings`,
      params: { league: leagueId, season: season },
      headers: {
        "x-apisports-key": process.env.NEXT_PUBLIC_API_FOOTBALL_KEY,
      },
    };
    
    const response = await axios.request(options);

    // If the API returns no data, cache an empty response to prevent repeated calls
    if (!response.data.response || response.data.response.length === 0) {
      const emptyResponse = { league: null, standings: [] };
      await redis.set(cacheKey, JSON.stringify(emptyResponse), "EX", CACHE_TTL_SECONDS);
      return NextResponse.json(emptyResponse);
    }

    const data = response.data.response[0];

    const transformedData = {
      league: {
        id: data.league.id,
        name: data.league.name,
        logo: data.league.logo,
        type: data.league.type,
        href: generateLeagueSlug(data.league.name, data.league.id),
      },
      standings: data.league.standings,
    };

    // 5. Store the fresh data in Redis
    await redis.set(cacheKey, JSON.stringify(transformedData), "EX", CACHE_TTL_SECONDS);
    console.log(`[Cache SET] Stored fresh data for key: ${cacheKey}`);

    return NextResponse.json(transformedData);

  } catch (error) {
    console.error(`[API/standings] Error for league ${leagueId}:`, error);
    return NextResponse.json(
      { error: "Failed to fetch standings data" },
      { status: 500 }
    );
  }
}