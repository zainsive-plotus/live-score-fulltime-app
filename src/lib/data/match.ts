// ===== src/lib/data/match.ts =====

import axios from "axios";
import "server-only";
import redis from "@/lib/redis";
import { logApiRequest, RequestContext } from "@/lib/logging";
import { calculateCustomPrediction } from "@/lib/prediction-engine";
import { getNews } from "@/lib/data/news";
import { getMatchHighlights as fetchHighlights } from "@/lib/data/highlightly";

const STALE_CACHE_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days
const LIVE_CACHE_TTL_SECONDS = 60; // 1 minute

/**
 * A centralized function to make requests to the third-party sports API,
 * with built-in Redis caching and detailed logging.
 */
const apiRequest = async <T>(
  endpoint: string,
  params: object,
  cacheKey: string,
  ttl: number,
  context: RequestContext
): Promise<T | null> => {
  try {
    const cachedData = await redis.get(cacheKey);
    if (cachedData) {
      // No log needed for cache HITs as no external request is made.
      return JSON.parse(cachedData);
    }

    // Log the request just before it is sent to the external API.
    logApiRequest(endpoint, params, context);

    const options = {
      method: "GET",
      url: `${process.env.NEXT_PUBLIC_API_FOOTBALL_HOST}/${endpoint}`,
      params,
      headers: { "x-apisports-key": process.env.NEXT_PUBLIC_API_FOOTBALL_KEY },
      timeout: 8000,
    };
    const response = await axios.request(options);
    const data = response.data.response;

    // Cache the data only if the response is valid and contains data.
    if (data && (!Array.isArray(data) || data.length > 0)) {
      await redis.set(cacheKey, JSON.stringify(data), "EX", ttl);
    }
    return data;
  } catch (error: any) {
    console.error(
      `[data/match.ts] API request for ${endpoint} with key ${cacheKey} failed: ${error.message}. Attempting to serve from cache.`
    );
    try {
      const cachedData = await redis.get(cacheKey);
      if (cachedData) {
        console.log(
          `[data/match.ts] ✓ Successfully served STALE data for key: ${cacheKey}`
        );
        return JSON.parse(cachedData);
      }
    } catch (cacheError) {
      console.error(
        `[data/match.ts] ✗ CRITICAL: Redis lookup failed during fallback for key ${cacheKey}.`,
        cacheError
      );
    }
    return null;
  }
};

// --- Data Fetching Functions (now with RequestContext) ---

export const getFixture = async (
  fixtureId: string,
  context: RequestContext
) => {
  const cacheKey = `fixture:${fixtureId}`;
  const fixtureResponse = await apiRequest<any[]>(
    "fixtures",
    { id: fixtureId },
    cacheKey,
    STALE_CACHE_TTL_SECONDS,
    context
  );
  if (!fixtureResponse || fixtureResponse.length === 0) return null;
  return fixtureResponse[0];
};

export const getStatistics = async (
  fixtureId: string,
  context: RequestContext
) => {
  const cacheKey = `statistics:${fixtureId}`;
  return await apiRequest<any[]>(
    "fixtures/statistics",
    { fixture: fixtureId },
    cacheKey,
    LIVE_CACHE_TTL_SECONDS,
    context
  );
};

export const getH2H = async (
  homeTeamId: number,
  awayTeamId: number,
  context: RequestContext
) => {
  const sortedIds = [homeTeamId, awayTeamId].sort();
  const cacheKey = `h2h:${sortedIds[0]}-${sortedIds[1]}`;
  return await apiRequest<any[]>(
    "fixtures/headtohead",
    { h2h: `${homeTeamId}-${awayTeamId}` },
    cacheKey,
    STALE_CACHE_TTL_SECONDS,
    context
  );
};

export const getTeamStats = async (
  leagueId: number,
  season: number,
  teamId: number,
  context: RequestContext
) => {
  const cacheKey = `team-stats:${teamId}:${leagueId}:${season}`;
  return await apiRequest<any>(
    "teams/statistics",
    { league: leagueId, season: season, team: teamId },
    cacheKey,
    STALE_CACHE_TTL_SECONDS,
    context
  );
};

export const getStandings = async (
  leagueId: number,
  season: number,
  context: RequestContext
) => {
  const cacheKey = `standings:${leagueId}:${season}`;
  return await apiRequest<any[]>(
    "standings",
    { league: leagueId, season: season },
    cacheKey,
    STALE_CACHE_TTL_SECONDS,
    context
  );
};

export const getBookmakerOdds = async (
  fixtureId: string,
  context: RequestContext
) => {
  const cacheKey = `odds:${fixtureId}`;
  const response = await apiRequest<any[]>(
    "odds",
    { fixture: fixtureId, bet: "1" },
    cacheKey,
    STALE_CACHE_TTL_SECONDS,
    context
  );
  return response ?? [];
};

// --- Helper Functions (No direct API calls, no context needed) ---

export const getLinkedNews = async (fixtureId: number, locale: string) => {
  const newsData = await getNews({
    linkedFixtureId: fixtureId,
    limit: 5,
    locale,
  });
  return newsData.posts;
};

export const getMatchHighlights = async (
  leagueName: string,
  homeTeamName: string,
  awayTeamName: string
) => {
  const highlightsData = await fetchHighlights({
    leagueName,
    homeTeamName,
    awayTeamName,
    limit: 10,
  });
  return highlightsData?.data ?? [];
};
