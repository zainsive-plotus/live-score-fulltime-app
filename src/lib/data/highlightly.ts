// ===== src/lib/data/highlightly.ts =====

import axios from "axios";
import redis from "@/lib/redis"; // Import Redis

const API_BASE_URL = "https://sports.highlightly.net/";
const API_KEY = process.env.NEXT_PUBLIC_HIGHLIGHTLY_API_KEY;

// --- Start of Caching Enhancement ---
const CACHE_KEY = "highlights:latest-popular";
const CACHE_TTL_SECONDS = 60 * 60 * 12; // 12 hours

// Internal helper function to validate a URL. It's not cached individually anymore.
async function isValidEmbed(url: string): Promise<boolean> {
  try {
    const response = await axios.get(url, {
      timeout: 4000,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });
    const content = response.data.toString().toLowerCase();
    const isUnavailable =
      content.includes("video unavailable") ||
      content.includes("not made this video available") ||
      content.includes("geo-restricted") ||
      content.includes("video is not available in your country");
    return !isUnavailable;
  } catch (error) {
    return false;
  }
}
// --- End of Caching Enhancement ---

async function request(endpoint: string, params?: object) {
  if (!API_KEY) {
    throw new Error("Highlightly API Key is not configured.");
  }
  try {
    const response = await axios.get(`${API_BASE_URL}/${endpoint}`, {
      params,
      headers: {
        "x-rapidapi-key": API_KEY,
        "x-rapidapi-host": "sports.highlightly.net",
      },
      timeout: 20000,
    });
    return response.data;
  } catch (error: any) {
    if (error.response && error.response.status === 404) {
      return null;
    }
    console.error(
      `[Highlightly Service] Error fetching from '${endpoint}':`,
      error.message
    );
    throw new Error(`Failed to fetch data from the highlights provider.`);
  }
}

export async function getMatchHighlights(params: object) {
  const data = await request("football/highlights", params);
  return data;
}

export async function getHighlightlyEntities(type: "leagues" | "teams") {
  const data = await request(type);
  return data[type] || data || [];
}

export async function getLatestPopularHighlights() {
  // --- Start of Caching Enhancement ---
  // 1. Try to get the final list from Redis first.
  const cachedData = await redis.get(CACHE_KEY);
  if (cachedData) {
    return JSON.parse(cachedData);
  }

  // 2. Cache Miss: Perform the expensive operations.
  const POPULAR_LEAGUE_IDS = [
    2486, 3337, 33973, 52695, 61205, 67162, 75672, 80778, 34824, 68013,
    8443, 13549, 11847, 14400, 15251, 10996, 39079, 41632, 56950, 69715,
  ];
  const allHighlights = [];

  for (const leagueId of POPULAR_LEAGUE_IDS) {
    const params = { leagueId, season: new Date().getFullYear(), limit: 10 };
    const result = await request("football/highlights", params);
    if (result && result.data && Array.isArray(result.data)) {
      allHighlights.push(...result.data);
    }
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  const uniqueHighlights = Array.from(
    new Map(allHighlights.map((item: any) => [item.id, item])).values()
  );

  const validationPromises = uniqueHighlights.map((highlight: any) =>
    isValidEmbed(highlight.embedUrl)
  );
  const validationResults = await Promise.all(validationPromises);
  const validHighlights = uniqueHighlights.filter((_, index) => validationResults[index]);

  const sortedAndFiltered = validHighlights
    .sort((a: any, b: any) => new Date(b.match.date).getTime() - new Date(a.match.date).getTime())
    .filter((i: any) => i.type !== "UNVERIFIED")
    .slice(0, 8);

  // 3. Store the final, clean list in Redis before returning.
  if (sortedAndFiltered.length > 0) {
    await redis.set(CACHE_KEY, JSON.stringify(sortedAndFiltered), "EX", CACHE_TTL_SECONDS);
  }
  
  return sortedAndFiltered;
  // --- End of Caching Enhancement ---
}