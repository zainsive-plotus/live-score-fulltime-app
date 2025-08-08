// ===== src/app/api/match-details/route.ts =====

import { NextResponse } from "next/server";
import redis from "@/lib/redis";
import { getFixture, getStatistics } from "@/lib/data/match";

const CACHE_TTL_LIVE = 60; // 1 minute
const CACHE_TTL_FINISHED = 60 * 60 * 24 * 7; // 1 week
const CACHE_TTL_UPCOMING = 60 * 15; // 15 minutes

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const fixtureId = searchParams.get("fixture");
  const locale = searchParams.get("locale") || "tr";

  if (!fixtureId) {
    return NextResponse.json(
      { error: "Fixture ID is required" },
      { status: 400 }
    );
  }

  // A new cache key to reflect the corrected data structure
  const cacheKey = `match-details-core-v9:${fixtureId}:${locale}`;

  try {
    const cachedData = await redis.get(cacheKey);
    if (cachedData) {
      return NextResponse.json(JSON.parse(cachedData));
    }

    const fixtureData = await getFixture(fixtureId);
    if (!fixtureData) {
      return NextResponse.json({ error: "Fixture not found" }, { status: 404 });
    }

    const { fixture } = fixtureData;

    // --- THIS IS THE FIX ---
    // Restore homeTeamStats and awayTeamStats to the main API call
    const settledPromises = await Promise.allSettled([
      getStatistics(fixtureId),
    ]);

    const getValue = (result: PromiseSettledResult<any>, fallback: any) => {
      if (result.status === "fulfilled") return result.value;
      console.error(
        `[API/match-details] A sub-request failed for fixture ${fixtureId}:`,
        result.reason
      );
      return fallback;
    };

    const statistics = getValue(settledPromises[0], []);

    // Explicitly remove lineups from the fixture object before sending
    if (fixtureData.lineups) {
      delete fixtureData.lineups;
    }
    // --- END OF FIX ---

    const responseData = {
      fixture: fixtureData,
      statistics,
    };

    const status = fixture.status.short;
    let ttl = CACHE_TTL_UPCOMING;
    if (["1H", "HT", "2H", "ET", "P", "LIVE"].includes(status)) {
      ttl = CACHE_TTL_LIVE;
    } else if (["FT", "AET", "PEN"].includes(status)) {
      ttl = CACHE_TTL_FINISHED;
    }

    await redis.set(cacheKey, JSON.stringify(responseData), "EX", ttl);

    return NextResponse.json(responseData);
  } catch (error: any) {
    console.error(
      `[API /match-details] A critical error occurred for fixture ${fixtureId}:`,
      error.message
    );
    return NextResponse.json(
      { error: "Failed to fetch core match details." },
      { status: 500 }
    );
  }
}
