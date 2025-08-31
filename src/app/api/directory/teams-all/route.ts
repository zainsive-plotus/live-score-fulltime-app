// ===== src/app/api/directory/teams-all/route.ts =====

import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Team from "@/models/Team";
import { topLeaguesConfig } from "@/config/topLeaguesConfig";
import axios from "axios";
import redis from "@/lib/redis";

const BASE_URL =
  process.env.NEXT_PUBLIC_PUBLIC_APP_URL || "http://localhost:3000";

const CACHE_KEY = `teams:directory:all-teams-prioritized-v1`;
const CACHE_TTL_SECONDS = 60 * 60 * 24; // Cache for 24 hours

// Helper to get popular teams based on your config
const getPopularTeams = async () => {
  try {
    const season = new Date().getFullYear();
    // Use a larger slice of top leagues to gather a good set of popular teams
    const popularLeagueIds = topLeaguesConfig
      .sort((a, b) => a.priority - b.priority)
      .slice(0, 10) // Increased to 10 for a wider popular pool
      .map((l) => l.leagueId);

    const teamPromises = popularLeagueIds.map((leagueId) =>
      // Using internal API which might have its own caching
      axios.get(`${BASE_URL}/api/teams?league=${leagueId}&season=${season}`)
    );

    const responses = await Promise.allSettled(teamPromises);

    const allTeams = responses
      .filter((res) => res.status === "fulfilled" && res.value.data)
      .flatMap((res) => (res as PromiseFulfilledResult<any>).value.data);

    // Return standardized team format
    return Array.from(
      new Map(allTeams.map((item) => [item.team.id, item.team])).values()
    );
  } catch (error) {
    console.error("[API/teams-all] Failed to fetch popular teams:", error);
    return [];
  }
};

export async function GET(request: Request) {
  try {
    const cachedData = await redis.get(CACHE_KEY);
    if (cachedData) {
      return NextResponse.json(JSON.parse(cachedData));
    }

    await dbConnect();

    // 1. Fetch popular teams from the live API (or its cache)
    const popularTeams = await getPopularTeams();
    const popularTeamIds = new Set(popularTeams.map((t) => t.id));

    // 2. Fetch all other teams from our database, excluding the popular ones
    const regularTeams = await Team.find({
      teamId: { $nin: Array.from(popularTeamIds) },
    })
      .select("teamId name") // Fetch only necessary fields
      .sort({ name: 1 }) // Sort alphabetically
      .lean();

    // 3. Combine the lists: popular teams first, then the rest.
    // Map to the simple { id, name } structure the runner needs.
    const combinedList = [
      ...popularTeams.map((t) => ({ id: t.id, name: t.name })),
      ...regularTeams.map((t) => ({ id: t.teamId, name: t.name })),
    ];

    // 4. Remove any potential duplicates that might have slipped through
    const uniqueList = Array.from(
      new Map(combinedList.map((item) => [item.id, item])).values()
    );

    if (uniqueList.length > 0) {
      await redis.set(
        CACHE_KEY,
        JSON.stringify(uniqueList),
        "EX",
        CACHE_TTL_SECONDS
      );
    }

    return NextResponse.json(uniqueList);
  } catch (error: any) {
    console.error("[API/teams-all] Server error:", error);
    return NextResponse.json(
      { error: "Server error fetching full team list." },
      { status: 500 }
    );
  }
}
