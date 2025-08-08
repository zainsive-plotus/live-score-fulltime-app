// ===== src/app/api/team-form-data/route.ts =====

import { NextResponse } from "next/server";
import { getTeamStats } from "@/lib/data/match";
import redis from "@/lib/redis";

const CACHE_TTL_SECONDS = 60 * 60 * 6; // Cache for 6 hours

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const teamId = searchParams.get("teamId");
  const leagueId = searchParams.get("leagueId");
  const season = searchParams.get("season");

  if (!teamId || !leagueId || !season) {
    return NextResponse.json(
      { error: "teamId, leagueId, and season are required" },
      { status: 400 }
    );
  }

  const cacheKey = `team-form-data:${teamId}:${leagueId}:${season}`;

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

    // We will still return a 200 OK with null if no stats are found.
    // The client component will handle the "unavailable" message.
    const responseData = teamStats || null;

    await redis.set(
      cacheKey,
      JSON.stringify(responseData),
      "EX",
      CACHE_TTL_SECONDS
    );

    return NextResponse.json(responseData);
  } catch (error: any) {
    console.error(
      `[API/team-form-data] Failed to get data for team ${teamId}:`,
      error.message
    );
    // On failure, return null so the client component can handle it gracefully.
    return NextResponse.json(null, { status: 200 });
  }
}
