// ===== src/app/api/h2h/route.ts =====

import { NextResponse } from "next/server";
import { getH2H } from "@/lib/data/match";
import redis from "@/lib/redis";

const CACHE_TTL_SECONDS = 60 * 60 * 6; // Cache for 6 hours

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const homeTeamId = searchParams.get("home");
  const awayTeamId = searchParams.get("away");

  if (!homeTeamId || !awayTeamId) {
    return NextResponse.json(
      { error: "home and away team IDs are required parameters" },
      { status: 400 }
    );
  }

  const sortedIds = [homeTeamId, awayTeamId].sort();
  const cacheKey = `h2h:${sortedIds[0]}-${sortedIds[1]}`;

  try {
    const cachedData = await redis.get(cacheKey);
    if (cachedData) {
      return NextResponse.json(JSON.parse(cachedData));
    }

    const h2hData = await getH2H(Number(homeTeamId), Number(awayTeamId));

    if (!h2hData) {
      await redis.set(
        cacheKey,
        JSON.stringify([]),
        "EX",
        CACHE_TTL_SECONDS / 2
      );
      return NextResponse.json([]);
    }

    await redis.set(cacheKey, JSON.stringify(h2hData), "EX", CACHE_TTL_SECONDS);

    return NextResponse.json(h2hData);
  } catch (error: any) {
    console.error(
      `[API/h2h] Failed to get H2H for ${homeTeamId} vs ${awayTeamId}:`,
      error.message
    );
    // Return empty array on failure so the client doesn't crash
    return NextResponse.json([]);
  }
}
