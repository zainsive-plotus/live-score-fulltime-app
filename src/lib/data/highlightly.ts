// ===== src/lib/data/highlightly.ts =====

import axios from "axios";
import { format, subDays } from "date-fns";

const API_BASE_URL = "https://sports.highlightly.net/";
const API_KEY = process.env.NEXT_PUBLIC_HIGHLIGHTLY_API_KEY;

// A centralized, private request function to handle all API calls
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

// --- Public Service Functions ---

/**
 * Fetches highlight data for a specific match using detailed parameters.
 * @param params - The detailed match parameters required by the Highlightly API.
 * @returns The raw highlight data from the API.
 */
export async function getMatchHighlights(params: object) {
  const data = await request("football/highlights", params);
  return data;
}

/**
 * Fetches a list of all entities (leagues or teams) from Highlightly.
 * @param type - The type of entity to fetch ('leagues' or 'teams').
 * @returns A list of entities.
 */
export async function getHighlightlyEntities(type: "leagues" | "teams") {
  const data = await request(type);
  return data[type] || data || [];
}

/**
 * Fetches the latest highlights from the past few days for popular leagues sequentially.
 * This function is optimized to prevent network timeouts.
 * @returns A sorted and sliced list of the latest highlight metadata.
 */
export async function getLatestPopularHighlights() {
  const POPULAR_LEAGUE_IDS = [
    2486, // UEFA Champions League
    3337, // UEFA Europa League
    33973, // Premier League (England)
    52695, // Ligue 1 (France)
    61205, // Serie A (Brazil - Campeonato Brasileiro Série A)
    67162, // Bundesliga (Germany)
    75672, // Eredivisie (Netherlands)
    80778, // Primeira Liga (Portugal)
    34824, // Championship (England)
    68013, // 2. Bundesliga (Germany)
    8443, // Copa America
    13549, // FIFA Club World Cup
    11847, // CONMEBOL Libertadores
    14400, // CONCACAF Champions League
    15251, // AFC Champions League
    10996, // CAF Champions League
    39079, // FA Cup (England)
    41632, // League Cup (England)
    56950, // Coupe de France (France)
    69715, // DFB Pokal (Germany)
  ];
  const allHighlights = [];

  for (const leagueId of POPULAR_LEAGUE_IDS) {
    const params = {
      leagueId,
      season: new Date().getFullYear(),
      limit: 10,
    };

    // Await each request before starting the next one.
    const result = await request("football/highlights", params);

    if (result && result.data && Array.isArray(result.data)) {
      allHighlights.push(...result.data);
    }

    // Add a small delay between requests to be respectful to the API
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  const uniqueHighlights = Array.from(
    new Map(allHighlights.map((item: any) => [item.id, item])).values()
  );

  // Sort by date to get the absolute latest ones first
  uniqueHighlights.sort(
    (a: any, b: any) =>
      new Date(b.match.date).getTime() - new Date(a.match.date).getTime()
  );

  // Return the top 5 latest highlights from this search
  return uniqueHighlights.filter((i) => i.type !== "UNVERIFIED").slice(0, 8);
}
