// ===== src/lib/data/highlightly.ts =====

import axios from "axios";
import redis from "@/lib/redis";

const API_BASE_URL = "https://soccer.highlightly.net/highlights";
const API_KEY = process.env.NEXT_PUBLIC_HIGHLIGHTLY_API_KEY;

const CACHE_KEY = "highlights:latest-v6"; // Incremented cache key
const CACHE_TTL_SUCCESS = 60 * 15; // Cache successful responses for 15 minutes
const CACHE_TTL_RATELIMIT = 60 * 5; // Cache a rate-limit error for 5 minutes to give it time to reset

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

    console.log(JSON.stringify(params));
    console.log(JSON.stringify(response.data));

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
    });

    if (!result || !result.data || !Array.isArray(result.data)) {
      console.warn(
        "[Highlightly Service] No highlights data array returned from the API."
      );
      return [];
    }

    const uniqueHighlights = Array.from(
      new Map(result.data.map((item: any) => [item.embedUrl, item])).values()
    );

    if (uniqueHighlights.length > 0) {
      await redis.set(
        CACHE_KEY,
        JSON.stringify(uniqueHighlights),
        "EX",
        CACHE_TTL_SUCCESS // Use the longer TTL for successful fetches
      );
      console.log(
        `[Highlightly Service] Cached ${uniqueHighlights.length} new highlights.`
      );
    }

    return uniqueHighlights;
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
