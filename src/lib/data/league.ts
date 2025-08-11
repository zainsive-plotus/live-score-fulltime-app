// ===== src/lib/data/league.ts =====

import "server-only";
import axios from "axios";
import redis from "@/lib/redis";

const STALE_CACHE_TTL_SECONDS = 60 * 60 * 24 * 7; // Keep stale data for 7 days

// This new function is resilient to API failures.
export async function getLeaguePageData(leagueId: string): Promise<any | null> {
  const cacheKey = `league-page-data:${leagueId}`;
  const season = new Date().getFullYear();

  try {
    const options = (endpoint: string, params: object) => ({
      method: "GET",
      url: `${process.env.NEXT_PUBLIC_API_FOOTBALL_HOST}/${endpoint}`,
      params,
      headers: { "x-apisports-key": process.env.NEXT_PUBLIC_API_FOOTBALL_KEY },
      timeout: 8000,
    });

    const [leagueDetailsResponse, standingsResponse] = await Promise.all([
      axios.request(options("leagues", { id: leagueId })),
      axios.request(options("standings", { league: leagueId, season: season })),
    ]);

    const leagueData = leagueDetailsResponse.data.response[0];
    if (!leagueData) {
      // If the league doesn't exist, throw an error to trigger the cache fallback
      throw new Error(`League with ID ${leagueId} not found in external API.`);
    }

    leagueData.standings =
      standingsResponse.data.response[0]?.league?.standings || [];

    // Cache the fresh data
    await redis.set(
      cacheKey,
      JSON.stringify(leagueData),
      "EX",
      STALE_CACHE_TTL_SECONDS
    );

    return leagueData;
  } catch (error: any) {
    // If the live API fails, try to serve stale data from the cache.
    console.error(
      `[data/league] API fetch failed for leagueId ${leagueId}:`,
      error.code || error.message
    );
    console.log(
      `[data/league] Attempting to serve stale data from cache for key: ${cacheKey}`
    );

    try {
      const cachedData = await redis.get(cacheKey);
      if (cachedData) {
        console.log(
          `[data/league] ✓ Successfully served stale data for leagueId ${leagueId}.`
        );
        return JSON.parse(cachedData);
      } else {
        console.error(
          `[data/league] ✗ No stale data available in cache for leagueId ${leagueId}. Returning null.`
        );
        return null;
      }
    } catch (cacheError) {
      console.error(
        `[data/league] ✗ CRITICAL: Failed to access Redis during fallback for leagueId ${leagueId}.`,
        cacheError
      );
      return null;
    }
  }
}
