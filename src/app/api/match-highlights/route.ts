// ===== src/app/api/match-highlights/route.ts =====

import { NextResponse } from "next/server";
import { getMatchHighlights } from "@/lib/data/highlightly";
import redis from "@/lib/redis";

const CACHE_TTL_SECONDS = 60 * 60 * 2; // Cache for 2 hours

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const leagueName = searchParams.get("leagueName");
  const homeTeamName = searchParams.get("homeTeamName");
  const awayTeamName = searchParams.get("awayTeamName");

  if (!leagueName || !homeTeamName || !awayTeamName) {
    return NextResponse.json(
      { error: "leagueName, homeTeamName, and awayTeamName are required" },
      { status: 400 }
    );
  }

  const cacheKey =
    `highlights:${leagueName}:${homeTeamName}:${awayTeamName}`.replace(
      /\s+/g,
      "-"
    );

  try {
    const cachedData = await redis.get(cacheKey);
    if (cachedData) {
      return NextResponse.json(JSON.parse(cachedData));
    }

    const highlightsData = await getMatchHighlights({
      leagueName,
      homeTeamName,
      awayTeamName,
      limit: 10,
    });

    const highlights = highlightsData?.data ?? [];

    await redis.set(
      cacheKey,
      JSON.stringify(highlights),
      "EX",
      CACHE_TTL_SECONDS
    );

    return NextResponse.json(highlights);
  } catch (error: any) {
    console.error(
      `[API/match-highlights] Failed to get highlights:`,
      error.message
    );
    return NextResponse.json([]);
  }
}
