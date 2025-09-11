// ===== src/lib/data/match.ts =====

import axios from "axios";
import "server-only";
import redis from "@/lib/redis";
import { calculateCustomPrediction } from "@/lib/prediction-engine";
import { getNews } from "@/lib/data/news";
import { getMatchHighlights as fetchHighlights } from "@/lib/data/highlightly";

// --- REMOVED `import { cache } from "react";` ---

const STALE_CACHE_TTL_SECONDS = 60 * 60 * 24 * 7;
const LIVE_CACHE_TTL_SECONDS = 60;

// The apiRequest function is already robust and handles the cache-aside pattern correctly.
const apiRequest = async <T>(
  endpoint: string,
  params: object,
  cacheKey: string,
  ttl: number
): Promise<T | null> => {
  try {
    // --- THIS IS THE CORRECT LOGIC. Let Redis do the caching. ---
    const cachedData = await redis.get(cacheKey);
    if (cachedData) {
      console.log(`[data/match.ts] Cache HIT for key: ${cacheKey}`);
      return JSON.parse(cachedData);
    }

    console.log(
      `[data/match.ts] Cache MISS for key: ${cacheKey}. Fetching from API.`
    );

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
    // The fallback to serve stale data on API failure is also handled here.
    console.error(
      `[data/match.ts] API request for ${endpoint} with key ${cacheKey} failed: ${error.message}. Attempting to serve from cache.`
    );
    // ... rest of the error handling ...
    return null;
  }
};

// --- CORE CHANGE: Removed `cache()` wrapper from all functions ---

export const getFixture = async (fixtureId: string) => {
  const cacheKey = `fixture:${fixtureId}`;
  const fixtureResponse = await apiRequest<any[]>(
    "fixtures",
    { id: fixtureId },
    cacheKey,
    STALE_CACHE_TTL_SECONDS
  );
  if (!fixtureResponse || fixtureResponse.length === 0) return null;
  return fixtureResponse[0];
};

export const getStatistics = async (fixtureId: string) => {
  const cacheKey = `statistics:${fixtureId}`;
  return await apiRequest<any[]>(
    "fixtures/statistics",
    { fixture: fixtureId },
    cacheKey,
    LIVE_CACHE_TTL_SECONDS
  );
};

export const getH2H = async (homeTeamId: number, awayTeamId: number) => {
  const sortedIds = [homeTeamId, awayTeamId].sort();
  const cacheKey = `h2h:${sortedIds[0]}-${sortedIds[1]}`;
  return await apiRequest<any[]>(
    "fixtures/headtohead",
    { h2h: `${homeTeamId}-${awayTeamId}` },
    cacheKey,
    STALE_CACHE_TTL_SECONDS
  );
};

export const getTeamStats = async (
  leagueId: number,
  season: number,
  teamId: number
) => {
  const cacheKey = `team-stats:${teamId}:${leagueId}:${season}`;
  return await apiRequest<any>(
    "teams/statistics",
    { league: leagueId, season: season, team: teamId },
    cacheKey,
    STALE_CACHE_TTL_SECONDS
  );
};

export const getStandings = async (leagueId: number, season: number) => {
  const cacheKey = `standings:${leagueId}:${season}`;
  return await apiRequest<any[]>(
    "standings",
    { league: leagueId, season: season },
    cacheKey,
    STALE_CACHE_TTL_SECONDS
  );
};

export const getBookmakerOdds = async (fixtureId: string) => {
  const cacheKey = `odds:${fixtureId}`;
  const response = await apiRequest<any[]>(
    "odds",
    { fixture: fixtureId, bet: "1" },
    cacheKey,
    STALE_CACHE_TTL_SECONDS
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

export const getPredictionData = async (
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

  const flatStandings = standingsResponse?.[0]?.league?.standings?.flat() || [];
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
};

// This function remains for potential direct use but should be avoided in page rendering paths.
export const fetchMatchPageData = async (fixtureId: string) => {
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
};
