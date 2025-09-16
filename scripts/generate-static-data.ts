import axios, { AxiosError } from "axios";
import path from "path";
// We no longer need the fs module for writing files
import Redis from "ioredis"; // Import the ioredis client

// --- Configuration ---
const API_HOST = "https://v3.football.api-sports.io";
const API_KEY = "01639ef12b7b3c0314dbed363ec6d0b8";
const BATCH_SIZE = 25;
const BATCH_DELAY_MS = 500;

// --- Redis Connection ---

const redis = new Redis({
  host: "redis-14265.c250.eu-central-1-1.ec2.redns.redis-cloud.com",
  port: "14265",
  password: "pc8yx7Xg09TRnmlocgUjGTHn4YlXz9rt",
});

console.log("Connecting to Redis...");
redis.on("connect", () =>
  console.log("✓ Redis connection established for script.")
);
redis.on("error", (err) => console.error("✗ Redis connection error:", err));

// --- Type Definitions ---
interface ApiLeague {
  league: { id: number; name: string };
  seasons: { year: number; current: boolean }[];
}

interface ApiTeamInfo {
  team: { id: number; [key: string]: any };
  venue: any;
}

/**
 * Makes a request to the API-Football service with type safety.
 */
async function apiRequest<T>(
  endpoint: string,
  params: object = {}
): Promise<T[]> {
  try {
    const response = await axios.get<{ response: T[] }>(
      `${API_HOST}/${endpoint}`,
      {
        params,
        headers: { "x-apisports-key": API_KEY },
        timeout: 20000, // 20-second timeout
      }
    );
    return response.data.response || [];
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      console.error(
        `API Error fetching ${endpoint} with params ${JSON.stringify(
          params
        )}: ${axiosError.message}`
      );
    } else {
      console.error(
        `An unexpected error occurred fetching ${endpoint}:`,
        error
      );
    }
    return []; // Return empty on failure to ensure script resilience
  }
}

async function generateLeagueDataInRedis(): Promise<ApiLeague[]> {
  console.log("--- 1. Starting League Data Population in Redis ---");
  const allLeagues = await apiRequest<ApiLeague>("leagues", {
    current: "true",
  });

  if (allLeagues.length === 0) {
    throw new Error("No leagues returned from the API.");
  }
  console.log(`Found ${allLeagues.length} leagues. Writing to Redis...`);

  const pipeline = redis.pipeline();
  allLeagues.forEach((leagueData) => {
    const key = `league:static:${leagueData.league.id}`;
    pipeline.set(key, JSON.stringify(leagueData));
  });

  await pipeline.exec();
  console.log(
    `✓ Successfully wrote ${allLeagues.length} league records to Redis.`
  );
  return allLeagues;
}

async function generateTeamDataInRedis(leagues: ApiLeague[]): Promise<void> {
  console.log("\n--- 2. Starting Team Data Population in Redis ---");
  const uniqueTeams = new Map<number, ApiTeamInfo>();
  const season = new Date().getFullYear();

  const leagueIds = leagues.map((l) => l.league.id);
  const totalBatches = Math.ceil(leagueIds.length / BATCH_SIZE);

  for (let i = 0; i < leagueIds.length; i += BATCH_SIZE) {
    const batchIds = leagueIds.slice(i, i + BATCH_SIZE);
    const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
    console.log(
      `⚙️  Processing Team Batch ${batchNumber} of ${totalBatches}...`
    );

    const batchPromises = batchIds.map((id) =>
      apiRequest<ApiTeamInfo>("teams", { league: id, season })
    );
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
      `📦 Batch ${batchNumber} complete. Found ${newTeamsInBatch} new unique teams. Total unique so far: ${uniqueTeams.size}.`
    );

    if (i + BATCH_SIZE < leagueIds.length) {
      await new Promise((resolve) => setTimeout(resolve, BATCH_DELAY_MS));
    }
  }

  const allTeamData = Array.from(uniqueTeams.values());
  console.log(
    `\nFound a total of ${allTeamData.length} unique teams. Writing to Redis...`
  );

  const pipeline = redis.pipeline();
  allTeamData.forEach((teamData) => {
    const key = `team:static:${teamData.team.id}`;
    pipeline.set(key, JSON.stringify(teamData));
  });

  await pipeline.exec();
  console.log(
    `✓ Successfully wrote ${allTeamData.length} team records to Redis.`
  );
}

async function main() {
  if (!API_HOST || !API_KEY) {
    throw new Error("API_HOST and API_KEY environment variables must be set.");
  }

  console.log("🚀 Starting static data population for Redis cache...");

  const leagues = await generateLeagueDataInRedis();
  await generateTeamDataInRedis(leagues);

  await redis.quit(); // Disconnect the script's Redis client
  console.log("\n🎉 Redis cache population complete!");
}

main().catch((error) => {
  console.error("\n❌ Script failed with a critical error:", error);
  redis.quit();
  process.exit(1);
});
