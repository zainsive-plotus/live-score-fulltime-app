// ===== src/lib/data/standings.ts =====

import "server-only";
import axios from "axios";

const BASE_URL =
  process.env.NEXT_PUBLIC_PUBLIC_APP_URL || "http://localhost:3000";

/**
 * Fetches the initial standings data for a league and season.
 * This is used on the server to get data for side widgets and SEO text generation.
 * @param leagueId - The ID of the league.
 * @param season - The season year.
 * @returns {Promise<any | null>} The standings data or null on error.
 */
export async function getInitialStandingsData(
  leagueId: string,
  season: string
) {
  try {
    const { data } = await axios.get(
      `${BASE_URL}/api/standings?league=${leagueId}&season=${season}`
    );
    return data;
  } catch (error) {
    console.error(
      `[data/standings] Failed to fetch initial standings for league ${leagueId}:`,
      error
    );
    return null;
  }
}
