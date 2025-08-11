// ===== src/lib/data/team.ts =====

import axios from "axios";
import redis from "@/lib/redis";
import "server-only"; // Ensure this is only used on the server

const STALE_CACHE_TTL_SECONDS = 60 * 60 * 24 * 7; // Keep stale data for 7 days as a fallback

export async function fetchTeamDetails(teamId: string) {
  const season = new Date().getFullYear().toString();
  const cacheKey = `team-details:${teamId}:${season}`;

  try {
    const options = (endpoint: string, params: object) => ({
      method: "GET",
      url: `${process.env.NEXT_PUBLIC_API_FOOTBALL_HOST}/${endpoint}`,
      params,
      headers: { "x-apisports-key": process.env.NEXT_PUBLIC_API_FOOTBALL_KEY },
      timeout: 8000, // Fail faster to allow cache fallback
    });

    // Use Promise.allSettled to prevent one failed sub-request from crashing the whole function
    const results = await Promise.allSettled([
      axios.request(options("teams", { id: teamId })),
      axios.request(options("players/squads", { team: teamId })),
      axios.request(options("fixtures", { team: teamId, last: 10 })),
      axios.request(options("standings", { team: teamId, season: season })),
    ]);

    const teamInfoResponse =
      results[0].status === "fulfilled" ? results[0].value : null;
    const squadResponse =
      results[1].status === "fulfilled" ? results[1].value : null;
    const recentFixturesResponse =
      results[2].status === "fulfilled" ? results[2].value : null;
    const standingsResponse =
      results[3].status === "fulfilled" ? results[3].value : null;

    // The primary check: we must have basic team info to proceed.
    if (
      !teamInfoResponse ||
      !teamInfoResponse.data.response ||
      teamInfoResponse.data.response.length === 0
    ) {
      throw new Error(`No team info found for teamId: ${teamId}`);
    }

    const responseData = {
      teamInfo: teamInfoResponse.data.response[0],
      squad: squadResponse?.data.response[0]?.players ?? [],
      fixtures: recentFixturesResponse?.data.response ?? [],
      standings: standingsResponse?.data.response ?? [],
    };

    await redis.set(
      cacheKey,
      JSON.stringify(responseData),
      "EX",
      STALE_CACHE_TTL_SECONDS
    );

    return responseData;
  } catch (error: any) {
    // --- THIS IS THE FIX ---
    // If any API call fails, we try to serve stale data from the cache.
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
        return JSON.parse(cachedData);
      } else {
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
