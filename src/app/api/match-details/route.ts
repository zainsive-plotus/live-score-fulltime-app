// ===== src/app/api/match-details/route.ts =====

import { NextResponse } from "next/server";
import axios from "axios";
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

    const [
      statistics,
      h2h,
      homeTeamStats,
      awayTeamStats,
      standingsResponse,
      bookmakerOdds,
      linkedNews,
      highlights,
    ] = await Promise.all([
      getStatistics(fixtureId),
      getH2H(home.id, away.id),
      getTeamStats(league.id, league.season, home.id),
      getTeamStats(league.id, league.season, away.id),
      getStandings(league.id, league.season),
      getBookmakerOdds(fixtureId),
      getLinkedNews(fixture.id, locale),
      getMatchHighlights(league.name, home.name, away.name),
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
      null, // Events not needed for pre-match prediction
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
      `[API /match-details] Error for fixture ${fixtureId}:`,
      error.message
    );
    return NextResponse.json(
      { error: "Failed to fetch match details." },
      { status: 500 }
    );
  }
}
