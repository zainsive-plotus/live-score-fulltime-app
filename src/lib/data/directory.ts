// ===== src/lib/data/directory.ts =====

import "server-only";
import axios from "axios";
import { generateStandingsSlug } from "../generate-standings-slug";

const STANDINGS_LEAGUE_IDS = new Set([
  39, 140, 135, 78, 61, 2, 3, 848, 88, 94, 203, 144, 179, 218, 207, 253, 262,
  71, 128, 239, 265, 130, 98, 307, 20,
]);

async function apiRequest(endpoint: string, params: object) {
  const options = {
    method: "GET",
    url: `${process.env.NEXT_PUBLIC_API_FOOTBALL_HOST}/${endpoint}`,
    params,
    headers: { "x-apisports-key": process.env.NEXT_PUBLIC_API_FOOTBALL_KEY },
    timeout: 10000,
  };
  try {
    const response = await axios.request(options);
    return response.data.response;
  } catch (error) {
    console.error(
      `[data/directory] API request failed for ${endpoint}:`,
      error
    );
    return [];
  }
}

export async function getLeaguesForStandingsSitemap() {
  try {
    const leagues = await apiRequest("leagues", { current: "true" });

    const popularLeagues = leagues.filter(
      (item: any) =>
        STANDINGS_LEAGUE_IDS.has(item.league.id) &&
        item.league.type === "League"
    );

    return popularLeagues.map((item: any) => ({
      id: item.league.id,
      name: item.league.name,
    }));
  } catch (error) {
    console.error(
      "[data/directory] Failed to fetch leagues for standings sitemap:",
      error
    );
    return [];
  }
}
