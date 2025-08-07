// ===== src/app/api/team-details/route.ts =====

import { NextResponse } from "next/server";
import { getTeamStats } from "@/lib/data/match";
import redis from "@/lib/redis";

const CACHE_TTL_SECONDS = 60 * 60 * 6; // Cache for 6 hours

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const teamId = searchParams.get("team");
  const leagueId = searchParams.get("league");
  const season = searchParams.get("season");

  if (!teamId || !leagueId || !season) {
    return NextResponse.json(
      { error: "team, league, and season are required parameters" },
      { status: 400 }
    );
  }

  const cacheKey = `team-stats:${teamId}:${leagueId}:${season}`;

  try {
    const cachedData = await redis.get(cacheKey);
    if (cachedData) {
      return NextResponse.json(JSON.parse(cachedData));
    }

    const teamStats = await getTeamStats(
      Number(leagueId),
      Number(season),
      Number(teamId)
    );

    if (!teamStats) {
      // Cache a null response to prevent repeated failed lookups
      await redis.set(
        cacheKey,
        JSON.stringify(null),
        "EX",
        CACHE_TTL_SECONDS / 2
      );
      return NextResponse.json(null, { status: 404 });
    }

    await redis.set(
      cacheKey,
      JSON.stringify(teamStats),
      "EX",
      CACHE_TTL_SECONDS
    );

    return NextResponse.json(teamStats);
  } catch (error: any) {
    console.error(
      `[API/team-details] Failed to get stats for team ${teamId}:`,
      error.message
    );
    return NextResponse.json(
      { error: "Failed to fetch team statistics." },
      { status: 500 }
    );
  }
}
