// ===== src/app/api/match-prediction/route.ts =====

import { NextResponse } from "next/server";
import {
  getFixture,
  getH2H,
  getTeamStats,
  getStandings,
  getBookmakerOdds,
} from "@/lib/data/match";
import { calculateCustomPrediction } from "@/lib/prediction-engine";
import redis from "@/lib/redis";

const CACHE_TTL_SECONDS = 60 * 30; // 30 minutes for fresh data
const STALE_CACHE_TTL_SECONDS = 60 * 60 * 24 * 3; // Keep stale data for 3 days as a fallback

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const fixtureId = searchParams.get("fixtureId");

  if (!fixtureId) {
    return NextResponse.json(
      { error: "Fixture ID is required" },
      { status: 400 }
    );
  }

  const cacheKey = `prediction-data-v3:${fixtureId}`; // v3 to ensure new cache structure

  try {
    // --- THIS IS THE NEW LOGIC ---
    // Attempt the live fetch first. The entire block is wrapped in a try/catch.
    const fixtureData = await getFixture(fixtureId);
    if (!fixtureData) {
      throw new Error(
        `Fixture not found from external API for ID: ${fixtureId}`
      );
    }

    const { league, teams } = fixtureData;
    const { home, away } = teams;

    const results = await Promise.allSettled([
      getH2H(home.id, away.id),
      getTeamStats(league.id, league.season, home.id),
      getTeamStats(league.id, league.season, away.id),
      getStandings(league.id, league.season),
      getBookmakerOdds(fixtureId),
    ]);

    const getValue = (result: PromiseSettledResult<any>, fallback: any) => {
      if (result.status === "fulfilled") return result.value;
      // Throw an error to trigger the main catch block for a unified failure path
      throw new Error(
        `A sub-request failed: ${result.reason?.message || "Unknown error"}`
      );
    };

    const h2h = getValue(results[0], []);
    const homeTeamStats = getValue(results[1], null);
    const awayTeamStats = getValue(results[2], null);
    const standingsResponse = getValue(results[3], []);
    const bookmakerOdds = getValue(results[4], []);

    const flatStandings =
      standingsResponse?.[0]?.league?.standings?.flat() || [];
    const homeTeamRank = flatStandings.find(
      (s: any) => s.team.id === home.id
    )?.rank;
    const awayTeamRank = flatStandings.find(
      (s: any) => s.team.id === away.id
    )?.rank;

    const customPrediction = calculateCustomPrediction(
      h2h,
      homeTeamStats,
      awayTeamStats,
      home.id,
      homeTeamRank,
      awayTeamRank,
      null,
      fixtureData.fixture.status.short
    );

    const responseData = {
      customPrediction,
      bookmakerOdds: bookmakerOdds?.[0]?.bookmakers ?? [],
      teams,
    };

    // If successful, cache the data with a long TTL to serve as a future fallback
    await redis.set(
      cacheKey,
      JSON.stringify(responseData),
      "EX",
      STALE_CACHE_TTL_SECONDS
    );

    return NextResponse.json(responseData);
  } catch (error: any) {
    // --- THIS IS THE FALLBACK LOGIC ---
    // The live fetch failed. Now we try to serve from the cache.
    console.error(
      `[API/match-prediction] LIVE FETCH FAILED for fixture ${fixtureId}: ${error.message}. Attempting to serve stale data...`
    );

    try {
      const cachedData = await redis.get(cacheKey);
      if (cachedData) {
        console.log(
          `[API/match-prediction] ✓ Successfully served STALE data for fixture ${fixtureId}`
        );
        return NextResponse.json(JSON.parse(cachedData));
      } else {
        console.error(
          `[API/match-prediction] ✗ No stale data in cache for fixture ${fixtureId}. Data is truly unavailable.`
        );
        return NextResponse.json(null); // Return null with 200 OK
      }
    } catch (cacheError: any) {
      console.error(
        `[API/match-prediction] ✗ CRITICAL: Redis lookup failed during fallback for fixture ${fixtureId}:`,
        cacheError.message
      );
      return NextResponse.json(null); // Return null with 200 OK
    }
    // --- END OF FIX ---
  }
}
