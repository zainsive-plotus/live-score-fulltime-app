// ===== src/app/api/lineups/route.ts =====

import { NextResponse } from "next/server";
import axios from "axios";
import redis from "@/lib/redis";

const CACHE_TTL_LIVE = 60 * 5; // Cache live lineups for 5 minutes
const CACHE_TTL_FINISHED = 60 * 60 * 24 * 7; // Cache finished lineups for 1 week

const apiRequest = async (endpoint: string, params: object) => {
  const options = {
    method: "GET",
    url: `${process.env.NEXT_PUBLIC_API_FOOTBALL_HOST}/${endpoint}`,
    params,
    headers: { "x-apisports-key": process.env.NEXT_PUBLIC_API_FOOTBALL_KEY },
  };
  try {
    const response = await axios.request(options);
    return response.data.response;
  } catch (error) {
    console.error(`[API/lineups] Failed to fetch from external API:`, error);
    // Return null to indicate failure to the main handler
    return null;
  }
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const fixtureId = searchParams.get("fixtureId");

  if (!fixtureId) {
    return NextResponse.json(
      { error: "fixtureId is a required parameter" },
      { status: 400 }
    );
  }

  const cacheKey = `lineups:${fixtureId}`;

  try {
    const cachedData = await redis.get(cacheKey);
    if (cachedData) {
      return NextResponse.json(JSON.parse(cachedData));
    }

    const lineupsData = await apiRequest("fixtures/lineups", {
      fixture: fixtureId,
    });

    // Determine if the match is finished to set a longer cache
    const fixtureData = await apiRequest("fixtures", { id: fixtureId });
    const isFinished = ["FT", "AET", "PEN"].includes(
      fixtureData?.[0]?.fixture?.status?.short
    );

    const ttl = isFinished ? CACHE_TTL_FINISHED : CACHE_TTL_LIVE;

    await redis.set(cacheKey, JSON.stringify(lineupsData || []), "EX", ttl);

    return NextResponse.json(lineupsData || []);
  } catch (error: any) {
    console.error(
      `[API/lineups] A critical error occurred for fixture ${fixtureId}:`,
      error.message
    );
    return NextResponse.json([], { status: 200 }); // Return empty array on critical error
  }
}
