import axios from "axios";
import redis from "@/lib/redis";
import "server-only";
import { cache } from "react";
import { logApiRequest, RequestContext } from "@/lib/logging"; // <-- Import logger and context

const STATIC_CACHE_TTL = 60 * 60 * 24;
const DYNAMIC_CACHE_TTL = 60 * 60 * 6;

// UPDATED apiRequest to be consistent with match.ts
const apiRequest = async <T>(
  endpoint: string,
  params: object,
  cacheKey: string,
  ttl: number,
  context?: RequestContext // <-- Add optional context
): Promise<T | null> => {
  try {
    const cachedData = await redis.get(cacheKey);
    if (cachedData) {
      return JSON.parse(cachedData);
    }
  } catch (e) {
    console.error(`[data/team] Redis GET failed for key ${cacheKey}.`, e);
  }

  // logApiRequest(endpoint, params, context); // <-- Use the logger

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
      `[data/team] API fetch failed for key ${cacheKey}:`,
      error.code || error.message
    );
    // Fallback to cache on API error
    try {
      const cachedData = await redis.get(cacheKey);
      if (cachedData) {
        console.warn(`[data/team] ✓ Serving STALE data for key: ${cacheKey}`);
        return JSON.parse(cachedData);
      }
    } catch (cacheError) {
      console.error(
        `[data/team] ✗ CRITICAL: Redis lookup failed during fallback for key ${cacheKey}.`,
        cacheError
      );
    }
    return null;
  }
};

// UPDATE all function signatures to accept optional context
export const getTeamInfo = cache(
  async (teamId: string, context?: RequestContext) => {
    const data = await apiRequest<any[]>(
      "teams",
      { id: teamId },
      `team:info:${teamId}`,
      STATIC_CACHE_TTL,
      context // <-- Pass context
    );
    return data?.[0] ?? null;
  }
);

export const getTeamSquad = cache(
  async (teamId: string, context?: RequestContext) => {
    const data = await apiRequest<any[]>(
      "players/squads",
      { team: teamId },
      `team:squad:${teamId}`,
      STATIC_CACHE_TTL,
      context // <-- Pass context
    );
    return data?.[0]?.players ?? [];
  }
);

export const getTeamFixtures = cache(
  async (teamId: string, context?: RequestContext) => {
    return await apiRequest<any[]>(
      "fixtures",
      { team: teamId, last: 20 },
      `team:fixtures:${teamId}`,
      DYNAMIC_CACHE_TTL,
      context // <-- Pass context
    );
  }
);

export const getTeamStandings = cache(
  async (teamId: string, context?: RequestContext) => {
    const season = new Date().getFullYear().toString();
    const cacheKey = `team:standings:v3:${teamId}:${season}`;
    try {
      const cachedData = await redis.get(cacheKey);
      if (cachedData) {
        return JSON.parse(cachedData);
      }
      const teamLeaguesResponse = await apiRequest<any[]>(
        "leagues",
        { team: teamId },
        `team:leagues:${teamId}`,
        STATIC_CACHE_TTL,
        context // <-- Pass context
      );
      if (!teamLeaguesResponse || teamLeaguesResponse.length === 0) {
        return null;
      }
      const primaryLeagueInfo = teamLeaguesResponse
        .filter(
          (item) =>
            item.league.type === "League" &&
            item.seasons.some((s: any) => s.year.toString() === season)
        )
        .sort((a, b) => a.league.id - b.league.id)[0];
      if (!primaryLeagueInfo) {
        return null;
      }
      const { league } = primaryLeagueInfo;
      const standingsData = await apiRequest<any[]>(
        "standings",
        { league: league.id, season: season },
        `standings:${league.id}:${season}`,
        DYNAMIC_CACHE_TTL,
        context // <-- Pass context
      );
      await redis.set(
        cacheKey,
        JSON.stringify(standingsData),
        "EX",
        DYNAMIC_CACHE_TTL
      );
      return standingsData;
    } catch (error) {
      console.error(
        `[data/team] CRITICAL: Failed to execute getTeamStandings for team ${teamId}`,
        error
      );
      try {
        const cachedData = await redis.get(cacheKey);
        if (cachedData) return JSON.parse(cachedData);
      } catch (e) {}
      return null;
    }
  }
);

export async function getTeamPageData(
  teamId: string,
  context?: RequestContext
) {
  const [teamInfo, squad, fixtures, standings] = await Promise.all([
    getTeamInfo(teamId, context),
    getTeamSquad(teamId, context),
    getTeamFixtures(teamId, context),
    getTeamStandings(teamId, context),
  ]);
  if (!teamInfo) {
    return null;
  }
  return { teamInfo, squad, fixtures, standings };
}
