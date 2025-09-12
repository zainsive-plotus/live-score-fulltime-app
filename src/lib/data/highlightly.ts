// ===== src/lib/data/highlightly.ts =====

import axios from "axios";
import redis from "@/lib/redis";

const API_BASE_URL = "https://soccer.highlightly.net/highlights";
const API_KEY = process.env.NEXT_PUBLIC_HIGHLIGHTLY_API_KEY;

const CACHE_KEY = "highlights:latest-v6"; // Incremented cache key
const TEAM_CACHE_KEY_PREFIX = "highlights:team:v1:";
const LEAGUE_CACHE_KEY_PREFIX = "highlights:league:v1:";
const CACHE_TTL_SUCCESS = 60 * 15; // 15 minutes for latest
const CACHE_TTL_TEAM = 60 * 60 * 24; // 24 hours for team-specific
const CACHE_TTL_RATELIMIT = 60 * 5;
const CACHE_TTL_TEAM_LEAGUE = 60 * 60 * 24;

async function request(endpoint: string, params?: object) {
  if (!API_KEY) {
    console.error(
      "[Highlightly Service] FATAL: HIGHLIGHTLY_API key is not configured."
    );
    throw new Error("Highlightly API Key is not configured.");
  }
  try {
    const response = await axios.get(`${API_BASE_URL}`, {
      params,
      headers: {
        "x-rapidapi-key": API_KEY,
        "x-rapidapi-host": "football-highlights-api.p.rapidapi.com",
      },
      timeout: 15000,
    });
    console.log(
      `[Highlightly Service] API SUCCESS: Fetched ${
        response.data?.data?.length || 0
      } items from /${endpoint}`
    );

    return response.data;
  } catch (error: any) {
    // This is the critical part: we now specifically check for the 429 error
    if (axios.isAxiosError(error) && error.response?.status === 429) {
      console.warn(
        "[Highlightly Service] WARN: Received 429 Rate Limit error from API."
      );
      // We create a specific error type to handle this upstream
      const rateLimitError = new Error("Rate limited by Highlightly API");
      rateLimitError.name = "RateLimitError";
      throw rateLimitError;
    }
    console.error(
      `[Highlightly Service] ERROR: Failed to fetch from '${endpoint}':`,
      error.message
    );
    throw new Error(
      `Failed to fetch data from the highlights provider: ${error.message}`
    );
  }
}

export async function getMatchHighlights(params: object) {
  const data = await request("football/highlights", params);
  return data;
}

// This is the primary function to get the latest highlights.
export async function getLatestPopularHighlights() {
  const cachedData = await redis.get(CACHE_KEY);
  if (cachedData) {
    const parsedData = JSON.parse(cachedData);
    // If we cached an error state, we respect it.
    if (parsedData.isRateLimited) {
      console.log(
        "[Highlightly Service] Serving RATE_LIMITED status from cache."
      );
      return [];
    }
    console.log("[Highlightly Service] Serving latest highlights from cache.");
    return parsedData;
  }

  console.log(
    "[Highlightly Service] Cache miss. Fetching latest highlights from Highlightly API's 'latest' endpoint."
  );

  try {
    const result = await request("football/highlights", {
      limit: 40,
      season: 2025,
    });
    if (!result || !result.data || !Array.isArray(result.data)) {
      console.warn(
        "[Highlightly Service] No highlights data array returned from the API."
      );
      return [];
    }

    // const uniqueHighlights = Array.from(
    //   new Map(result.data.map((item: any) => [item.embedUrl, item])).values()
    // );

    const highlights = result.data;
    if (highlights.length > 0) {
      await redis.set(
        CACHE_KEY,
        JSON.stringify(highlights),
        "EX",
        CACHE_TTL_SUCCESS // Use the longer TTL for successful fetches
      );
      console.log(
        `[Highlightly Service] Cached ${highlights.length} new highlights.`
      );
    }

    return highlights;
  } catch (error: any) {
    // Here we catch the specific RateLimitError
    if (error.name === "RateLimitError") {
      console.log(
        `[Highlightly Service] Caching RATE_LIMITED status for ${CACHE_TTL_RATELIMIT} seconds.`
      );
      // Cache a special object indicating we are rate-limited
      await redis.set(
        CACHE_KEY,
        JSON.stringify({ isRateLimited: true }),
        "EX",
        CACHE_TTL_RATELIMIT // Use the shorter TTL for the error state
      );
    } else {
      console.error(
        "[Highlightly Service] An unexpected error occurred during fetch. Returning empty array.",
        error
      );
    }

    return []; // Always return an empty array on any failure to prevent the page from crashing.
  }
}

/**
 * Fetches and caches video highlights for a specific team.
 * It searches for matches where the team was either home or away.
 *
 * @param teamName The name of the team to search for.
 * @returns A promise that resolves to an array of highlight objects.
 */
export async function getHighlightsForTeam(teamName: string): Promise<any[]> {
  if (!API_KEY) {
    console.error("[Highlightly Service] API key is not configured.");
    return [];
  }

  const cacheKey = `${TEAM_CACHE_KEY_PREFIX}${teamName.replace(/\s+/g, "-")}`;

  try {
    const cachedData = await redis.get(cacheKey);
    if (cachedData) {
      console.log(
        `[Highlightly Service] Cache HIT for team highlights: ${teamName}`
      );
      return JSON.parse(cachedData);
    }
  } catch (e) {
    console.error(
      `[Highlightly Service] Redis GET failed for key ${cacheKey}`,
      e
    );
  }

  console.log(
    `[Highlightly Service] Cache MISS for team highlights: ${teamName}. Fetching from API.`
  );

  try {
    // Fetch both home and away games in parallel
    const [homeGames, awayGames] = await Promise.all([
      request("football/highlights", { homeTeamName: teamName, limit: 20 }),
      request("football/highlights", { awayTeamName: teamName, limit: 20 }),
    ]);

    const allHighlights = [
      ...(homeGames?.data || []),
      ...(awayGames?.data || []),
    ];

    // De-duplicate highlights and sort by date
    const uniqueHighlights = Array.from(
      new Map(allHighlights.map((item) => [item.id, item])).values()
    );
    uniqueHighlights.sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );

    await redis.set(
      cacheKey,
      JSON.stringify(uniqueHighlights),
      "EX",
      CACHE_TTL_TEAM
    );
    console.log(
      `[Highlightly Service] Cached ${uniqueHighlights.length} highlights for ${teamName}.`
    );

    return uniqueHighlights;
  } catch (error) {
    console.error(
      `[Highlightly Service] Failed to fetch highlights for team ${teamName}:`,
      error
    );
    return []; // Return empty array on failure
  }
}

/**
 * Fetches and caches video highlights for a specific league.
 *
 * @param leagueName The name of the league to search for.
 * @returns A promise that resolves to an array of highlight objects.
 */
export async function getHighlightsForLeague(
  leagueName: string
): Promise<any[]> {
  if (!API_KEY) {
    console.error("[Highlightly Service] API key is not configured.");
    return [];
  }

  const cacheKey = `${LEAGUE_CACHE_KEY_PREFIX}${leagueName.replace(
    /\s+/g,
    "-"
  )}`;

  try {
    const cachedData = await redis.get(cacheKey);
    if (cachedData) {
      console.log(
        `[Highlightly Service] Cache HIT for league highlights: ${leagueName}`
      );
      return JSON.parse(cachedData);
    }
  } catch (e) {
    console.error(
      `[Highlightly Service] Redis GET failed for key ${cacheKey}`,
      e
    );
  }

  console.log(
    `[Highlightly Service] Cache MISS for league highlights: ${leagueName}. Fetching from API.`
  );

  try {
    const result = await request("football/highlights", {
      leagueName: leagueName,
      limit: 40,
    });

    if (!result || !result.data || !Array.isArray(result.data)) {
      console.warn(
        `[Highlightly Service] No highlights data array returned for league: ${leagueName}.`
      );
      await redis.set(
        cacheKey,
        JSON.stringify([]),
        "EX",
        CACHE_TTL_TEAM_LEAGUE
      ); // Cache empty result
      return [];
    }

    const highlights = result.data;
    highlights.sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );

    await redis.set(
      cacheKey,
      JSON.stringify(highlights),
      "EX",
      CACHE_TTL_TEAM_LEAGUE
    );
    console.log(
      `[Highlightly Service] Cached ${highlights.length} highlights for ${leagueName}.`
    );

    return highlights;
  } catch (error) {
    console.error(
      `[Highlightly Service] Failed to fetch highlights for league ${leagueName}:`,
      error
    );
    return []; // Return empty array on failure
  }
}
