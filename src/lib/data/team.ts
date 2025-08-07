// ===== src/lib/data/team.ts =====

import axios from "axios";
import redis from "@/lib/redis";

const CACHE_TTL_SECONDS = 60 * 60 * 12; // 12 hours for fresh data
const STALE_CACHE_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days for stale data

export async function fetchTeamDetails(teamId: string) {
  const season = new Date().getFullYear().toString();
  const cacheKey = `team-details:${teamId}:${season}`;

  try {
    const options = (endpoint: string, params: object) => ({
      method: "GET",
      url: `${process.env.NEXT_PUBLIC_API_FOOTBALL_HOST}/${endpoint}`,
      params,
      headers: { "x-apisports-key": process.env.NEXT_PUBLIC_API_FOOTBALL_KEY },
      timeout: 8000, // Set a reasonable timeout
    });

    const [
      teamInfoResponse,
      squadResponse,
      recentFixturesResponse,
      standingsResponse,
    ] = await Promise.all([
      axios.request(options("teams", { id: teamId })),
      axios.request(options("players/squads", { team: teamId })),
      axios.request(options("fixtures", { team: teamId, last: 10 })),
      axios.request(options("standings", { team: teamId, season: season })),
    ]);

    if (
      !teamInfoResponse.data.response ||
      teamInfoResponse.data.response.length === 0
    ) {
      console.warn(`[data/team] No team info found for teamId: ${teamId}`);
      return null;
    }

    const responseData = {
      teamInfo: teamInfoResponse.data.response[0],
      squad: squadResponse.data.response[0]?.players ?? [],
      fixtures: recentFixturesResponse.data.response,
      standings: standingsResponse.data.response,
    };

    // Set the cache with a standard TTL
    await redis.set(
      cacheKey,
      JSON.stringify(responseData),
      "EX",
      CACHE_TTL_SECONDS
    );

    return responseData;
  } catch (error: any) {
    // --- THIS IS THE FIX ---
    // If any API call fails (timeout, DNS error, etc.), we try to serve stale data.
    console.error(
      `[data/team] API fetch failed for teamId ${teamId}:`,
      error.code || error.message
    );
    console.log(
      `[data/team] Attempting to serve stale data from cache for key: ${cacheKey}`
    );

    try {
      const cachedData = await redis.get(cacheKey);
      if (cachedData) {
        console.log(
          `[data/team] ✓ Successfully served stale data for teamId ${teamId}.`
        );
        // If we serve stale data, we can extend its life slightly
        await redis.expire(cacheKey, STALE_CACHE_TTL_SECONDS);
        return JSON.parse(cachedData);
      } else {
        // If there's no cached data at all, then we must fail.
        console.error(
          `[data/team] ✗ No stale data available in cache for teamId ${teamId}. Returning null.`
        );
        return null;
      }
    } catch (cacheError) {
      console.error(
        `[data/team] ✗ CRITICAL: Failed to access Redis during fallback for teamId ${teamId}.`,
        cacheError
      );
      return null;
    }
    // --- END OF FIX ---
  }
}
