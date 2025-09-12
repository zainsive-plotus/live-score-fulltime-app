// ===== src/lib/data/league.ts =====

import "server-only";
import axios from "axios";
import redis from "@/lib/redis";

const STALE_CACHE_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

/**
 * Fetches all necessary data for a league details page for a specific season.
 * This is the primary server-side data aggregator for this page type.
 * @param leagueId The ID of the league.
 * @param season The season year (e.g., "2023").
 * @returns A consolidated object of league data or null on failure.
 */
export async function getLeaguePageData(
  leagueId: string,
  season?: string
): Promise<any | null> {
  const cacheKey = `league-page-data:v2:${leagueId}:${season}`;

  try {
    const cachedData = await redis.get(cacheKey);
    if (cachedData) {
      return JSON.parse(cachedData);
    }
  } catch (e) {
    console.error(`[data/league] Redis GET failed for key ${cacheKey}`, e);
  }

  console.log(
    `[data/league] Cache MISS for key: ${cacheKey}. Fetching from API.`
  );

  try {
    const options = (endpoint: string, params: object) => ({
      method: "GET",
      url: `${process.env.NEXT_PUBLIC_API_FOOTBALL_HOST}/${endpoint}`,
      params,
      headers: { "x-apisports-key": process.env.NEXT_PUBLIC_API_FOOTBALL_KEY },
      timeout: 8000,
    });

    const [leagueDetailsResponse, standingsResponse, topScorersResponse] =
      await Promise.all([
        // The `season` param is used here for leagues to get season-specific info
        axios.request(options("leagues", { id: leagueId, season: season })),
        axios.request(
          options("standings", { league: leagueId, season: season })
        ),
        axios.request(
          options("players/topscorers", { league: leagueId, season: season })
        ),
      ]);

    const leagueData = leagueDetailsResponse.data.response[0];
    if (!leagueData) {
      throw new Error(
        `League with ID ${leagueId} not found for season ${season}.`
      );
    }

    // Combine all fetched data into a single object
    const combinedData = {
      ...leagueData,
      standings: standingsResponse.data.response[0]?.league?.standings || [],
      topScorer: topScorersResponse.data.response?.[0] || null,
      // Add logic for leagueStats if needed here
      leagueStats: null,
    };

    await redis.set(
      cacheKey,
      JSON.stringify(combinedData),
      "EX",
      STALE_CACHE_TTL_SECONDS
    );

    return combinedData;
  } catch (error: any) {
    console.error(
      `[data/league] API fetch failed for leagueId ${leagueId} season ${season}:`,
      error.code || error.message
    );

    // Attempt to serve stale data from a previous (default) season as a last resort
    try {
      const fallbackKey = `league-page-data:v2:${leagueId}:${new Date().getFullYear()}`;
      const staleData = await redis.get(fallbackKey);
      if (staleData) {
        console.warn(
          `[data/league] Serving stale data for key: ${fallbackKey}`
        );
        return JSON.parse(staleData);
      }
    } catch (e) {
      console.error(
        `[data/league] Stale cache lookup failed for leagueId ${leagueId}.`
      );
    }

    return null; // Return null on complete failure
  }
}
