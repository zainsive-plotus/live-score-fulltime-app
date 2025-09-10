import axios from "axios";
import redis from "@/lib/redis";
import "server-only";
import { cache } from "react";

const STATIC_CACHE_TTL = 60 * 60 * 24; // 24 hours
const DYNAMIC_CACHE_TTL = 60 * 60 * 6; // 6 hours

const apiRequest = async <T>(
  endpoint: string,
  params: object,
  cacheKey: string,
  ttl: number
): Promise<T | null> => {
  try {
    const cachedData = await redis.get(cacheKey);
    if (cachedData) {
      console.log(`[data/team] ✓ Cache HIT for key: ${cacheKey}`);
      return JSON.parse(cachedData);
    }
    console.log(
      `[data/team] Cache MISS for key: ${cacheKey}. Fetching from API...`
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
    console.error(
      `[data/team] API fetch failed for key ${cacheKey}:`,
      error.code || error.message
    );
    try {
      const cachedData = await redis.get(cacheKey);
      if (cachedData) {
        console.log(
          `[data/team] ✓ Successfully served STALE data for key: ${cacheKey}`
        );
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

export const getTeamInfo = cache(async (teamId: string) => {
  const data = await apiRequest<any[]>(
    "teams",
    { id: teamId },
    `team:info:${teamId}`,
    STATIC_CACHE_TTL
  );
  return data?.[0] ?? null;
});

export const getTeamSquad = cache(async (teamId: string) => {
  const data = await apiRequest<any[]>(
    "players/squads",
    { team: teamId },
    `team:squad:${teamId}`,
    STATIC_CACHE_TTL
  );
  return data?.[0]?.players ?? [];
});

export const getTeamFixtures = cache(async (teamId: string) => {
  return await apiRequest<any[]>(
    "fixtures",
    { team: teamId, last: 20 },
    `team:fixtures:${teamId}`,
    DYNAMIC_CACHE_TTL
  );
});

// ** THE FIX IS HERE: Rewritten to use the reliable /leagues?team={id} endpoint **
export const getTeamStandings = cache(async (teamId: string) => {
  const season = new Date().getFullYear().toString();
  const cacheKey = `team:standings:v3:${teamId}:${season}`; // Incremented version key

  try {
    const cachedData = await redis.get(cacheKey);
    if (cachedData) {
      console.log(`[data/team] ✓ Cache HIT for standings for team ${teamId}.`);
      return JSON.parse(cachedData);
    }

    // Step 1: Fetch all leagues the team is associated with.
    const teamLeaguesResponse = await apiRequest<any[]>(
      "leagues",
      { team: teamId },
      `team:leagues:${teamId}`, // Cache this intermediate result
      STATIC_CACHE_TTL
    );
    if (!teamLeaguesResponse || teamLeaguesResponse.length === 0) {
      console.warn(
        `[data/team] No leagues found for team ${teamId}. Cannot fetch standings.`
      );
      return null;
    }

    // Step 2: Filter to find the primary domestic "League" for the current season.
    const primaryLeagueInfo = teamLeaguesResponse
      .filter(
        (item) =>
          item.league.type === "League" &&
          item.seasons.some((s: any) => s.year.toString() === season)
      )
      // Sort by league ID as a fallback tie-breaker (lower IDs are often more primary)
      .sort((a, b) => a.league.id - b.league.id)[0];

    if (!primaryLeagueInfo) {
      console.warn(
        `[data/team] No primary "League" type competition found for team ${teamId} for the ${season} season.`
      );
      return null;
    }

    const { league } = primaryLeagueInfo;

    // Step 3: Fetch standings for the discovered league.
    console.log(
      `[data/team] Found primary league ${league.name} (${league.id}) for team ${teamId}. Fetching standings...`
    );
    const standingsData = await apiRequest<any[]>(
      "standings",
      { league: league.id, season: season },
      `standings:${league.id}:${season}`, // Use the standard league standings cache key
      DYNAMIC_CACHE_TTL
    );

    // Step 4: Cache the final result specifically for this team and return.
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
    // Attempt to serve stale data on critical failure
    try {
      const cachedData = await redis.get(cacheKey);
      if (cachedData) return JSON.parse(cachedData);
    } catch (e) {
      /* ignore */
    }
    return null;
  }
});

export async function getTeamPageData(teamId: string) {
  // Fetch all required data in parallel for maximum efficiency
  const [teamInfo, squad, fixtures, standings] = await Promise.all([
    getTeamInfo(teamId),
    getTeamSquad(teamId),
    getTeamFixtures(teamId),
    getTeamStandings(teamId),
  ]);

  // If the core team information doesn't exist, we can't render the page.
  if (!teamInfo) {
    return null;
  }

  return { teamInfo, squad, fixtures, standings };
}
