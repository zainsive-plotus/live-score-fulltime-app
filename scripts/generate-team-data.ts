// ===== scripts/generate-team-data.ts =====

import fs from "fs/promises";
import path from "path";
import axios from "axios";

const API_HOST = "https://v3.football.api-sports.io";
const API_KEY = "01639ef12b7b3c0314dbed363ec6d0b8";
const OUTPUT_PATH = path.join(process.cwd(), "public/data/teams-static.json");
const BATCH_SIZE = 25; // Number of parallel requests per batch
const BATCH_DELAY_MS = 300; // Delay between batches to respect rate limits

// --- Type Definitions ---
interface ApiLeague {
  league: { id: number; name: string };
}

interface ApiTeamInfo {
  team: { id: number; [key: string]: any };
  venue: any;
}

type TeamDataMap = Map<number, ApiTeamInfo>;

// --- Helper Functions ---

/**
 * Makes a request to the API-Football service.
 */
async function apiRequest<T>(endpoint: string, params: object): Promise<T[]> {
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
      console.error(
        `API Error fetching ${endpoint} with params ${JSON.stringify(
          params
        )}: ${error.message}`
      );
    }
    return []; // Return empty on failure to ensure script resilience
  }
}

/**
 * Loads existing team data from the JSON file to allow resuming.
 */
async function loadExistingData(): Promise<TeamDataMap> {
  try {
    const fileContent = await fs.readFile(OUTPUT_PATH, "utf-8");
    const parsedData: { [key: string]: ApiTeamInfo } = JSON.parse(fileContent);
    const teamMap = new Map(
      Object.entries(parsedData).map(([id, data]) => [parseInt(id), data])
    );
    console.log(
      `✅ Resumed with ${teamMap.size} teams from existing data file.`
    );
    return teamMap;
  } catch (error: any) {
    if (error.code === "ENOENT") {
      console.log(
        "📄 No existing data file found. Starting a fresh generation."
      );
    } else {
      console.warn(
        "⚠️ Could not read or parse existing data file, starting fresh.",
        error.message
      );
    }
    return new Map();
  }
}

/**
 * Saves the collected team data map to the JSON output file.
 */
async function saveProgress(teamMap: TeamDataMap): Promise<void> {
  const allTeamData = Object.fromEntries(teamMap.entries());
  await fs.mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
  await fs.writeFile(OUTPUT_PATH, JSON.stringify(allTeamData, null, 2));
}

// --- Main Script Logic ---

async function main() {
  if (!API_HOST || !API_KEY) {
    throw new Error("API_HOST and API_KEY environment variables must be set.");
  }

  console.log("🚀 Starting team data generation...");
  const uniqueTeams = await loadExistingData();

  console.log("Fetching all current leagues from API-Football...");
  const leagues = await apiRequest<ApiLeague>("leagues", { current: "true" });
  if (leagues.length === 0)
    throw new Error("No leagues returned from the API.");

  const leagueIds = leagues.map((l) => l.league.id);
  console.log(`Found ${leagueIds.length} leagues to process.`);

  const season = new Date().getFullYear();
  const totalBatches = Math.ceil(leagueIds.length / BATCH_SIZE);

  for (let i = 0; i < leagueIds.length; i += BATCH_SIZE) {
    const batchIds = leagueIds.slice(i, i + BATCH_SIZE);
    const batchNumber = Math.floor(i / BATCH_SIZE) + 1;

    console.log(
      `⚙️  Processing Batch ${batchNumber} of ${totalBatches} (${batchIds.length} leagues)...`
    );

    const batchPromises = batchIds.map((id) =>
      apiRequest<ApiTeamInfo>("teams", { league: id, season })
    );

    // This is the corrected line:
    const results = await Promise.all(batchPromises);

    const teamsInBatch = results.flat();

    let newTeamsInBatch = 0;
    teamsInBatch.forEach((teamData) => {
      if (teamData?.team?.id && !uniqueTeams.has(teamData.team.id)) {
        uniqueTeams.set(teamData.team.id, teamData);
        newTeamsInBatch++;
      }
    });

    console.log(
      `📦 Batch ${batchNumber} complete. Found ${newTeamsInBatch} new unique teams. Total: ${uniqueTeams.size}.`
    );

    await saveProgress(uniqueTeams);
    console.log(`💾 Progress saved to file.`);

    if (i + BATCH_SIZE < leagueIds.length) {
      console.log(`⏳ Waiting ${BATCH_DELAY_MS / 1000}s before next batch...`);
      await new Promise((resolve) => setTimeout(resolve, BATCH_DELAY_MS));
    }
  }

  console.log(
    `\n🎉 All batches complete! Final unique team count: ${uniqueTeams.size}.`
  );
  console.log(`✅ Team static data file is up-to-date at: ${OUTPUT_PATH}`);
}

main().catch((error) => {
  console.error("\n❌ Script failed with a critical error:", error);
  process.exit(1);
});
