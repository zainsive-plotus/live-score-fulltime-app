// ===== src/lib/data/league-static.ts =====

import "server-only";
import fs from "fs/promises";
import path from "path";
import { cache } from "react";

// --- Type Definition ---
// This should match the structure of the objects in your generated JSON file
export interface StaticLeague {
  id: number;
  name: string;
  logoUrl: string;
  countryName: string;
  countryFlagUrl: string | null;
  type: string;
  href: string;
}

// In-memory cache for the server's lifetime
let leagueDataCache: StaticLeague[] | null = null;

/**
 * Reads and caches the static league data from the pre-built JSON file.
 * This function is cached per-request by Next.js.
 * @returns {Promise<StaticLeague[]>} A promise that resolves to an array of all leagues.
 */
export const getLeaguesStaticData = cache(async (): Promise<StaticLeague[]> => {
  // Return from in-memory cache if available
  if (leagueDataCache) {
    return leagueDataCache;
  }

  try {
    const filePath = path.join(
      process.cwd(),
      "public/data/leagues-static.json"
    );
    const fileContent = await fs.readFile(filePath, "utf-8");
    const data: StaticLeague[] = JSON.parse(fileContent);

    // Store in the in-memory cache for subsequent requests
    leagueDataCache = data;

    return data;
  } catch (error) {
    console.error(
      "Error reading static league data file. This is critical for directory pages.",
      error
    );
    // Return an empty array to prevent the site from crashing if the file is missing.
    // The build process should always create this file, so this is a fallback.
    return [];
  }
});
