// ===== src/app/api/match-details/route.ts =====

import { NextResponse } from "next/server";
import redis from "@/lib/redis";
import {
  getFixture,
  getH2H,
  getTeamStats,
  getStandings,
  getBookmakerOdds,
  getLinkedNews,
  getMatchHighlights,
  getStatistics,
} from "@/lib/data/match";
import { calculateCustomPrediction } from "@/lib/prediction-engine";

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

  const cacheKey = `match-details-client-v2:${fixtureId}:${locale}`;

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

    // --- THIS IS THE FIX ---
    // We are switching from Promise.all to Promise.allSettled
    const allPromises = await Promise.allSettled([
      getStatistics(fixtureId),
      getH2H(home.id, away.id),
      getTeamStats(league.id, league.season, home.id),
      getTeamStats(league.id, league.season, away.id),
      getStandings(league.id, league.season),
      getBookmakerOdds(fixtureId),
      getLinkedNews(fixture.id, locale),
      getMatchHighlights(league.name, home.name, away.name),
    ]);

    // Helper to safely extract value or provide a fallback
    const getValue = (result: PromiseSettledResult<any>, fallback: any) => {
      if (result.status === "fulfilled") {
        return result.value;
      }
      // Log the error on the server for debugging, but don't crash the request
      console.error(
        `[API/match-details] A sub-request failed for fixture ${fixtureId}:`,
        result.reason
      );
      return fallback;
    };

    const statistics = getValue(allPromises[0], []);
    const h2h = getValue(allPromises[1], []);
    const homeTeamStats = getValue(allPromises[2], null);
    const awayTeamStats = getValue(allPromises[3], null);
    const standingsResponse = getValue(allPromises[4], []);
    const bookmakerOdds = getValue(allPromises[5], []);
    const linkedNews = getValue(allPromises[6], []);
    const highlights = getValue(allPromises[7], []);
    // --- END OF FIX ---

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
      fixture.status.short
    );

    const responseData = {
      fixture: fixtureData,
      statistics,
      h2h,
      homeTeamStats,
      awayTeamStats,
      standings: standingsResponse,
      predictionData: {
        customPrediction,
        bookmakerOdds: bookmakerOdds?.[0]?.bookmakers ?? [],
        teams,
      },
      linkedNews,
      highlights,
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
      { error: "Failed to fetch match details due to a critical error." },
      { status: 500 }
    );
  }
}
