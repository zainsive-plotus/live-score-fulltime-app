// ===== src/app/api/match-details/route.ts =====

import { NextResponse } from "next/server";
import redis from "@/lib/redis";
import {
  getFixture,
  getH2H,
  getTeamStats,
  getLinkedNews,
  getStatistics,
} from "@/lib/data/match";

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

  // A new, leaner cache key
  const cacheKey = `match-details-core-v3:${fixtureId}:${locale}`;

  try {
    const cachedData = await redis.get(cacheKey);
    if (cachedData) {
      return NextResponse.json(JSON.parse(cachedData));
    }

    const fixtureData = await getFixture(fixtureId);
    if (!fixtureData) {
      return NextResponse.json({ error: "Fixture not found" }, { status: 404 });
    }

    const { league, teams, fixture } = fixtureData;
    const { home, away } = teams;

    // Fetch only the fast, essential data for the main page layout
    const settledPromises = await Promise.allSettled([
      getStatistics(fixtureId),
      getH2H(home.id, away.id),
      getTeamStats(league.id, league.season, home.id),
      getTeamStats(league.id, league.season, away.id),
      getLinkedNews(fixture.id, locale),
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
    const h2h = getValue(settledPromises[1], []);
    const homeTeamStats = getValue(settledPromises[2], null);
    const awayTeamStats = getValue(settledPromises[3], null);
    const linkedNews = getValue(settledPromises[4], []);

    const responseData = {
      fixture: fixtureData,
      statistics,
      h2h,
      homeTeamStats,
      awayTeamStats,
      linkedNews,
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
      `[API /match-details] Critical error for fixture ${fixtureId}:`,
      error.message
    );
    return NextResponse.json(
      { error: "Failed to fetch core match details." },
      { status: 500 }
    );
  }
}
