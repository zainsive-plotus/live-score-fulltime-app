// ===== src/app/api/directory/standings-leagues/route.ts =====

import { NextResponse } from "next/server";
import { getLeaguesForStandingsSitemap } from "@/lib/data/directory"; // CHANGE: Import the shared function
import redis from "@/lib/redis";
import { generateStandingsSlug } from "@/lib/generate-standings-slug";

const CACHE_KEY = `leagues:directory:standings`;
const CACHE_TTL_SECONDS = 60 * 60 * 24;

export async function GET() {
  try {
    const cachedData = await redis.get(CACHE_KEY);
    if (cachedData) {
      return NextResponse.json(JSON.parse(cachedData));
    }

    // CHANGE: Use the shared server-side function to get the base data
    const leagues = await getLeaguesForStandingsSitemap();

    // The fetched data is simpler, so we need to add the href back for client-side use
    const transformedData = leagues.map((league: any) => ({
      ...league,
      href: `/football/standings/${generateStandingsSlug(
        league.name,
        league.id
      )}`,
    }));

    if (transformedData.length > 0) {
      await redis.set(
        CACHE_KEY,
        JSON.stringify(transformedData),
        "EX",
        CACHE_TTL_SECONDS
      );
    }

    return NextResponse.json(transformedData);
  } catch (error) {
    console.error("[API/directory/standings-leagues] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch directory of leagues with standings." },
      { status: 500 }
    );
  }
}
