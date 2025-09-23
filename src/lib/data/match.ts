import axios from "axios";
import "server-only";
import redis from "@/lib/redis";
import { logApiRequest, RequestContext } from "@/lib/logging";
import { getNews } from "@/lib/data/news";
import { getMatchHighlights as fetchHighlights } from "@/lib/data/highlightly";

const STALE_CACHE_TTL_SECONDS = 60 * 60 * 24 * 7;
const LIVE_CACHE_TTL_SECONDS = 60;

const apiRequest = async <T>(
  endpoint: string,
  params: object,
  cacheKey: string,
  ttl: number,
  context?: RequestContext // Context is optional
): Promise<T | null> => {
  try {
    const cachedData = await redis.get(cacheKey);
    if (cachedData) {
      return JSON.parse(cachedData);
    }
  } catch (e) {
    console.error(`[data/match.ts] Redis GET failed for key ${cacheKey}.`, e);
  }

  // Safely call the logger
  // logApiRequest(endpoint, params, context);

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

    if (data && (!Array.isArray(data) || data.length > 0)) {
      await redis.set(cacheKey, JSON.stringify(data), "EX", ttl);
    }
    return data;
  } catch (error: any) {
    console.error(
      `[data/match.ts] API request for ${endpoint} with key ${cacheKey} failed: ${error.message}. Attempting to serve from cache.`
    );
    // Fallback to cache on API error
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

export const getFixture = async (
  fixtureId: string,
  context?: RequestContext
) => {
  const cacheKey = `fixture:${fixtureId}`;

  // 1. Try to get from cache first for finished matches
  try {
    const cachedData = await redis.get(cacheKey);
    if (cachedData) {
      const parsedData = JSON.parse(cachedData);
      // If it's a finished match, we can return the cached version.
      if (["FT", "AET", "PEN"].includes(parsedData?.fixture?.status?.short)) {
        return parsedData;
      }
    }
  } catch (e) {
    console.error(`[data/match] Redis GET failed for key ${cacheKey}:`, e);
  }

  // 2. If not in cache, or if it's not a finished match, fetch from API
  try {
    const options = {
      method: "GET",
      url: `${process.env.NEXT_PUBLIC_API_FOOTBALL_HOST}/fixtures`,
      params: { id: fixtureId },
      headers: { "x-apisports-key": process.env.NEXT_PUBLIC_API_FOOTBALL_KEY },
      timeout: 8000,
    };
    const response = await axios.request(options);
    const fixtureResponse = response.data.response;

    if (!fixtureResponse || fixtureResponse.length === 0) return null;

    const fixtureData = fixtureResponse[0];
    const status = fixtureData.fixture.status.short;

    // 3. Set cache TTL based on match status
    let ttl = 0; // Default to no cache for upcoming/live
    if (["FT", "AET", "PEN"].includes(status)) {
      ttl = STALE_CACHE_TTL_SECONDS; // Long cache for finished matches
    }

    if (ttl > 0) {
      await redis.set(cacheKey, JSON.stringify(fixtureData), "EX", ttl);
    }

    return fixtureData;
  } catch (error) {
    console.error(
      `[data/match] API fetch failed for fixture ${fixtureId}. No cache available.`,
      error
    );
    return null;
  }
};

export const getStatistics = async (
  fixtureId: string,
  context?: RequestContext
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
  context?: RequestContext
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
  context?: RequestContext
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
  context?: RequestContext
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
  context?: RequestContext
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
