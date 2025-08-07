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

const CACHE_TTL_SECONDS = 60 * 30; // 30 minutes cache

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const fixtureId = searchParams.get("fixtureId");

  if (!fixtureId) {
    return NextResponse.json(
      { error: "Fixture ID is required" },
      { status: 400 }
    );
  }

  const cacheKey = `prediction-data:${fixtureId}`;

  try {
    const cachedData = await redis.get(cacheKey);
    if (cachedData) {
      return NextResponse.json(JSON.parse(cachedData));
    }

    const fixtureData = await getFixture(fixtureId);
    if (!fixtureData) {
      return NextResponse.json({ error: "Fixture not found" }, { status: 404 });
    }

    const { league, teams } = fixtureData;
    const { home, away } = teams;

    const [
      h2h,
      homeTeamStats,
      awayTeamStats,
      standingsResponse,
      bookmakerOdds,
    ] = await Promise.all([
      getH2H(home.id, away.id),
      getTeamStats(league.id, league.season, home.id),
      getTeamStats(league.id, league.season, away.id),
      getStandings(league.id, league.season),
      getBookmakerOdds(fixtureId),
    ]);

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

    // Cache the result for non-live matches
    const isLive = ["1H", "HT", "2H", "ET", "BT", "P", "LIVE"].includes(
      fixtureData.fixture.status?.short
    );
    if (!isLive) {
      await redis.set(
        cacheKey,
        JSON.stringify(responseData),
        "EX",
        CACHE_TTL_SECONDS
      );
    }

    return NextResponse.json(responseData);
  } catch (error: any) {
    console.error(
      `[API/match-prediction] Failed to get prediction data for fixture ${fixtureId}:`,
      error.message
    );
    return NextResponse.json(
      { error: "Failed to fetch prediction data." },
      { status: 500 }
    );
  }
}
