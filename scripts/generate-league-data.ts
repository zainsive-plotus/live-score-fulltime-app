// ===== scripts/generate-league-data.ts =====

import fs from "fs/promises";
import path from "path";
import axios from "axios";
import dotenv from "dotenv";
import slugify from "slugify";
import { topLeaguesConfig } from "../src/config/topLeaguesConfig"; // Adjust path as needed

const API_HOST = "https://v3.football.api-sports.io";
const API_KEY = "01639ef12b7b3c0314dbed363ec6d0b8";
const OUTPUT_PATH = path.join(process.cwd(), "public/data/leagues-static.json");

// --- Type Definitions ---
interface ApiLeagueResponseItem {
  league: {
    id: number;
    name: string;
    type: string;
    logo: string;
  };
  country: {
    name: string;
    code: string | null;
    flag: string | null;
  };
}

interface TransformedLeague {
  id: number;
  name: string;
  logoUrl: string;
  countryName: string;
  countryFlagUrl: string | null;
  type: string;
  href: string;
}

// --- Helper Functions ---

/**
 * Makes a request to the API-Football service.
 */
async function apiRequest<T>(endpoint: string, params: object): Promise<T[]> {
  if (!API_HOST || !API_KEY) {
    throw new Error(
      "API_HOST and API_KEY must be set in environment variables."
    );
  }
  try {
    const response = await axios.get<{ response: T[] }>(
      `${API_HOST}/${endpoint}`,
      {
        params,
        headers: { "x-apisports-key": API_KEY },
        timeout: 20000,
      }
    );
    return response.data.response || [];
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error(`API Error fetching ${endpoint}: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Generates a URL-friendly slug for a league.
 */
function generateLeagueSlug(name: string, id: number): string {
  const nameSlug = slugify(name, {
    lower: true,
    strict: true,
    trim: true,
    remove: /[*+~.()'"!:@]/g,
  });
  return `/football/league/${nameSlug}-${id}`;
}

// --- Main Script Logic ---

async function main() {
  console.log("🚀 Starting league data generation...");

  console.log("Fetching all current leagues from API-Football...");
  const leaguesFromApi = await apiRequest<ApiLeagueResponseItem>("leagues", {
    current: "true",
  });

  if (leaguesFromApi.length === 0) {
    throw new Error("No leagues were returned from the API. Halting script.");
  }
  console.log(`Received ${leaguesFromApi.length} league items from API.`);

  const transformedLeagues: TransformedLeague[] = leaguesFromApi
    .filter((item) => item.league && item.country) // Ensure essential data exists
    .map((item) => ({
      id: item.league.id,
      name: item.league.name,
      logoUrl: item.league.logo,
      countryName: item.country.name,
      countryFlagUrl: item.country.flag,
      type: item.league.type,
      href: generateLeagueSlug(item.league.name, item.league.id),
    }));

  console.log("Sorting leagues by priority and name...");
  const popularLeagueIds = new Set(
    topLeaguesConfig.map((l) => parseInt(l.leagueId, 10))
  );

  transformedLeagues.sort((a, b) => {
    const isAPopular = popularLeagueIds.has(a.id);
    const isBPopular = popularLeagueIds.has(b.id);

    if (isAPopular && !isBPopular) return -1;
    if (!isAPopular && isBPopular) return 1;

    // If both are popular or both are not, sort by name
    return a.name.localeCompare(b.name);
  });

  console.log(`Processed and sorted ${transformedLeagues.length} leagues.`);

  await fs.mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
  await fs.writeFile(OUTPUT_PATH, JSON.stringify(transformedLeagues, null, 2));

  console.log(`\n🎉 Success!`);
  console.log(`✅ League static data file created at: ${OUTPUT_PATH}`);
}

main().catch((error) => {
  console.error("\n❌ Script failed with a critical error:", error.message);
  process.exit(1);
});
