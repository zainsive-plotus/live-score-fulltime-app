// src/lib/data/match.ts

import { cache } from "react";
import axios from "axios";
import "server-only";
import redis from "@/lib/redis";
import { calculateCustomPrediction } from "@/lib/prediction-engine";
import { getNews } from "@/lib/data/news";
import { getMatchHighlights as fetchHighlights } from "@/lib/data/highlightly";

const STALE_CACHE_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days for stale data fallback
const LIVE_CACHE_TTL_SECONDS = 60; // 1 minute for live data

// Generic API request handler with caching logic
const apiRequest = async <T>(
  endpoint: string,
  params: object,
  cacheKey: string,
  ttl: number
): Promise<T | null> => {
  try {
    const options = {
      method: "GET",
      url: `${process.env.NEXT_PUBLIC_API_FOOTBALL_HOST}/${endpoint}`,
      params,
      headers: { "x-apisports-key": process.env.NEXT_PUBLIC_API_FOOTBALL_KEY },
      timeout: 8000,
    };
    const response = await axios.request(options);
    const data = response.data.response;

    // Cache the data if it's valid
    if (data && (!Array.isArray(data) || data.length > 0)) {
      await redis.set(cacheKey, JSON.stringify(data), "EX", ttl);
    }
    return data;
  } catch (error: any) {
    console.error(
      `[data/match.ts] API request for ${endpoint} with key ${cacheKey} failed: ${error.message}. Attempting to serve from cache.`
    );
    // On failure, try to serve stale data from cache.
    try {
      const cachedData = await redis.get(cacheKey);
      if (cachedData) {
        console.log(
          `[data/match.ts] ✓ Successfully served STALE data for key: ${cacheKey}`
        );
        return JSON.parse(cachedData);
      } else {
        console.error(
          `[data/match.ts] ✗ No stale data available in cache for key: ${cacheKey}.`
        );
        return null;
      }
    } catch (cacheError) {
      console.error(
        `[data/match.ts] ✗ CRITICAL: Redis lookup failed during fallback for key ${cacheKey}.`,
        cacheError
      );
      return null;
    }
  }
};

// --- OPTIMIZED getFixture FUNCTION ---
// This function is now cache-aware, prioritizing Redis lookup.
// This is critical for the SSG build process to be efficient.
export const getFixture = cache(async (fixtureId: string) => {
  const cacheKey = `fixture:${fixtureId}`;

  // 1. Always check the cache first.
  try {
    const cachedData = await redis.get(cacheKey);
    if (cachedData) {
      // During the build, this will hit the pre-hydrated cache from generateStaticParams.
      const data = JSON.parse(cachedData);
      return data[0] ?? data;
    }
  } catch (e) {
    console.error(`[data/match.ts] Redis GET failed for key ${cacheKey}:`, e);
  }

  // 2. If no cache, fetch from API.
  console.log(`[data/match.ts] Cache miss for ${cacheKey}. Fetching from API.`);
  const fixtureResponse = await apiRequest<any[]>(
    "fixtures",
    { id: fixtureId },
    cacheKey,
    STALE_CACHE_TTL_SECONDS // Use a long TTL for fixtures as they don't change until live.
  );

  if (!fixtureResponse || fixtureResponse.length === 0) return null;
  return fixtureResponse[0];
});
// --- END OF OPTIMIZED FUNCTION ---

export const getStatistics = cache(async (fixtureId: string) => {
  const cacheKey = `statistics:${fixtureId}`;
  const cachedData = await redis.get(cacheKey);
  if (cachedData) return JSON.parse(cachedData);

  return await apiRequest<any[]>(
    "fixtures/statistics",
    { fixture: fixtureId },
    cacheKey,
    LIVE_CACHE_TTL_SECONDS // Use a short TTL for stats as they change during live matches
  );
});

export const getH2H = cache(async (homeTeamId: number, awayTeamId: number) => {
  const sortedIds = [homeTeamId, awayTeamId].sort();
  const cacheKey = `h2h:${sortedIds[0]}-${sortedIds[1]}`;
  const cachedData = await redis.get(cacheKey);
  if (cachedData) return JSON.parse(cachedData);

  return await apiRequest<any[]>(
    "fixtures/headtohead",
    { h2h: `${homeTeamId}-${awayTeamId}` },
    cacheKey,
    STALE_CACHE_TTL_SECONDS
  );
});

export const getTeamStats = cache(
  async (leagueId: number, season: number, teamId: number) => {
    const cacheKey = `team-stats:${teamId}:${leagueId}:${season}`;
    const cachedData = await redis.get(cacheKey);
    if (cachedData) return JSON.parse(cachedData);

    return await apiRequest<any>(
      "teams/statistics",
      { league: leagueId, season: season, team: teamId },
      cacheKey,
      STALE_CACHE_TTL_SECONDS
    );
  }
);

export const getStandings = cache(async (leagueId: number, season: number) => {
  const cacheKey = `standings:${leagueId}:${season}`;
  const cachedData = await redis.get(cacheKey);
  if (cachedData) return JSON.parse(cachedData);

  return await apiRequest<any[]>(
    "standings",
    { league: leagueId, season: season },
    cacheKey,
    STALE_CACHE_TTL_SECONDS
  );
});

export const getBookmakerOdds = cache(async (fixtureId: string) => {
  const cacheKey = `odds:${fixtureId}`;
  const cachedData = await redis.get(cacheKey);
  if (cachedData) return JSON.parse(cachedData);

  const response = await apiRequest<any[]>(
    "odds",
    { fixture: fixtureId, bet: "1" },
    cacheKey,
    STALE_CACHE_TTL_SECONDS
  );
  return response ?? [];
});

export const getLinkedNews = cache(
  async (fixtureId: number, locale: string) => {
    const newsData = await getNews({
      linkedFixtureId: fixtureId,
      limit: 5,
      locale,
    });
    return newsData.posts;
  }
);

export const getMatchHighlights = cache(
  async (leagueName: string, homeTeamName: string, awayTeamName: string) => {
    const highlightsData = await fetchHighlights({
      leagueName,
      homeTeamName,
      awayTeamName,
      limit: 10,
    });
    return highlightsData?.data ?? [];
  }
);

export const getPredictionData = cache(
  async (
    fixtureId: string,
    homeTeamId: number,
    awayTeamId: number,
    leagueId: number,
    season: number
  ) => {
    const [h2h, homeTeamStats, awayTeamStats, standingsResponse] =
      await Promise.all([
        getH2H(homeTeamId, awayTeamId),
        getTeamStats(leagueId, season, homeTeamId),
        getTeamStats(leagueId, season, awayTeamId),
        getStandings(leagueId, season),
      ]);

    const flatStandings =
      standingsResponse?.[0]?.league?.standings?.flat() || [];
    const homeTeamRank = flatStandings.find(
      (s: any) => s.team.id === homeTeamId
    )?.rank;
    const awayTeamRank = flatStandings.find(
      (s: any) => s.team.id === awayTeamId
    )?.rank;

    const customPrediction = calculateCustomPrediction(
      h2h,
      homeTeamStats,
      awayTeamStats,
      homeTeamId,
      homeTeamRank,
      awayTeamRank,
      null,
      "NS"
    );

    return {
      homeTeamStats,
      awayTeamStats,
      customPrediction,
    };
  }
);

// This function remains for potential direct use but should be avoided in page rendering paths.
export const fetchMatchPageData = cache(async (fixtureId: string) => {
  console.warn(
    "DEPRECATED: fetchMatchPageData is called. Please refactor to use granular data hooks."
  );
  const fixtureData = await getFixture(fixtureId);
  if (!fixtureData) return null;
  const { league, teams } = fixtureData;
  const { home: homeTeam, away: awayTeam } = teams;
  const [
    statistics,
    h2h,
    homeTeamStats,
    awayTeamStats,
    standingsResponse,
    bookmakerOdds,
  ] = await Promise.all([
    getStatistics(fixtureId),
    getH2H(homeTeam.id, awayTeam.id),
    getTeamStats(league.id, league.season, homeTeam.id),
    getTeamStats(league.id, league.season, awayTeam.id),
    getStandings(league.id, league.season),
    getBookmakerOdds(fixtureId),
  ]);
  const standings = standingsResponse?.[0]?.league?.standings[0] || [];
  const homeTeamRank = standings.find(
    (s: any) => s.team.id === homeTeam.id
  )?.rank;
  const awayTeamRank = standings.find(
    (s: any) => s.team.id === awayTeam.id
  )?.rank;
  const customPrediction = calculateCustomPrediction(
    h2h,
    homeTeamStats,
    awayTeamStats,
    homeTeam.id,
    homeTeamRank,
    awayTeamRank,
    null,
    fixtureData.fixture.status.short
  );
  return {
    fixture: fixtureData,
    statistics,
    h2h,
    standings: standingsResponse,
    analytics: {
      homeTeamStats,
      awayTeamStats,
      customPrediction,
      bookmakerOdds,
    },
  };
});
