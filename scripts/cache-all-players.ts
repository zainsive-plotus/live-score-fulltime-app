// ===== scripts/cache-all-players.ts =====

import axios from "axios";
import chalk from "chalk";
import mongoose from "mongoose";
import Team from "../src/models/Team"; // Import the Team model to get team IDs
import Redis from "ioredis";

// --- Configuration ---
const MONGODB_URI =
  "mongodb+srv://malikseo856:Djr9jOgdoMQ862xG@cluster0.pu5jzdv.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const API_HOST = "https://v3.football.api-sports.io";
const API_KEY = "01639ef12b7b3c0314dbed363ec6d0b8";
const CACHE_TTL = 60 * 60 * 24 * 7; // Cache player data for 7 days
const BATCH_DELAY_MS = 300; // Delay between API calls to avoid rate limiting

const redis = new Redis({
  host: "redis-14265.c250.eu-central-1-1.ec2.redns.redis-cloud.com",
  port: "14265",
  password: "pc8yx7Xg09TRnmlocgUjGTHn4YlXz9rt",
});

if (!MONGODB_URI || !API_HOST || !API_KEY) {
  console.error(
    chalk.red(
      "[ERROR] Required environment variables (MONGO, API_HOST, API_KEY) are not set."
    )
  );
  process.exit(1);
}

// --- Helper Functions ---
const log = (message: string): void =>
  console.log(chalk.blue(`[INFO] ${message}`));
const logSuccess = (message: string): void =>
  console.log(chalk.green(`[SUCCESS] ${message}`));
const logError = (message: string): void =>
  console.error(chalk.red(`[ERROR] ${message}`));
const logWarn = (message: string): void =>
  console.warn(chalk.yellow(`[WARN] ${message}`));

// Reusable API request function
const apiRequest = async (endpoint: string, params: object) => {
  try {
    const response = await axios.get(`${API_HOST}/${endpoint}`, {
      params,
      headers: { "x-apisports-key": API_KEY },
      timeout: 10000,
    });
    return response.data.response;
  } catch (error: any) {
    logError(`API request to '${endpoint}' failed: ${error.message}`);
    return null;
  }
};

// Function to fetch and cache all data for a single player
async function cachePlayerData(playerId: number): Promise<boolean> {
  const season = new Date().getFullYear();
  const playerCacheKeys = [
    `player:all-stats:${playerId}`,
    `player:stats:${playerId}:${season}`,
    `player:transfers:${playerId}`,
    `player:trophies:${playerId}`,
    `player:seasons:${playerId}`,
  ];

  // Check if any key already exists to skip re-fetching
  const existingKeys = await redis.exists(...playerCacheKeys);
  if (existingKeys > 0) {
    // console.log(chalk.gray(`  - Skipping Player ID ${playerId} (already cached)`));
    return false; // Skipped
  }

  const [allStats, currentSeasonStats, transfers, trophies, seasons] =
    await Promise.all([
      apiRequest("players", { id: playerId }),
      apiRequest("players", { id: playerId, season }),
      apiRequest("transfers", { player: playerId }),
      apiRequest("trophies", { player: playerId }),
      apiRequest("players/seasons", { player: playerId }),
    ]);

  const pipeline = redis.pipeline();
  if (allStats)
    pipeline.set(
      `player:all-stats:${playerId}`,
      JSON.stringify(allStats),
      "EX",
      CACHE_TTL
    );
  if (currentSeasonStats)
    pipeline.set(
      `player:stats:${playerId}:${season}`,
      JSON.stringify(currentSeasonStats),
      "EX",
      CACHE_TTL
    );
  if (transfers)
    pipeline.set(
      `player:transfers:${playerId}`,
      JSON.stringify(transfers),
      "EX",
      CACHE_TTL
    );
  if (trophies)
    pipeline.set(
      `player:trophies:${playerId}`,
      JSON.stringify(trophies),
      "EX",
      CACHE_TTL
    );
  if (seasons)
    pipeline.set(
      `player:seasons:${playerId}`,
      JSON.stringify(seasons),
      "EX",
      CACHE_TTL
    );

  await pipeline.exec();
  return true; // Cached
}

// --- Main Execution Function ---
async function run(): Promise<void> {
  const startTime = Date.now();

  try {
    log("Connecting to the database to fetch team list...");
    await mongoose.connect(MONGODB_URI);
    logSuccess("Database connection established.");

    const teams = await Team.find({}).select("teamId name").lean();
    if (teams.length === 0) {
      throw new Error(
        "No teams found in the database. Run the team sync script first."
      );
    }
    log(`Found ${teams.length} teams to process for squads.`);

    const allPlayerIds = new Set<number>();
    let processedTeams = 0;

    for (const team of teams) {
      processedTeams++;
      log(
        `(${processedTeams}/${teams.length}) Fetching squad for ${team.name}...`
      );
      const squadData = await apiRequest("players/squads", {
        team: team.teamId,
      });
      if (squadData && squadData[0]?.players) {
        squadData[0].players.forEach((player: any) =>
          allPlayerIds.add(player.id)
        );
      }
      await new Promise((res) => setTimeout(res, BATCH_DELAY_MS)); // Rate limiting
    }

    const uniquePlayerIds = Array.from(allPlayerIds);
    logSuccess(
      `Collected ${uniquePlayerIds.length} unique player IDs. Starting cache population...`
    );

    let cachedCount = 0;
    let skippedCount = 0;
    for (let i = 0; i < uniquePlayerIds.length; i++) {
      const playerId = uniquePlayerIds[i];
      process.stdout.write(
        chalk.gray(
          `  (${i + 1}/${
            uniquePlayerIds.length
          }) Caching player ${playerId}... `
        )
      );
      const wasCached = await cachePlayerData(playerId);
      if (wasCached) {
        process.stdout.write(chalk.green("Done.\n"));
        cachedCount++;
      } else {
        process.stdout.write(chalk.yellow("Skipped.\n"));
        skippedCount++;
      }
      await new Promise((res) => setTimeout(res, BATCH_DELAY_MS)); // Rate limiting
    }

    logSuccess(
      `Cache population complete. Newly cached: ${cachedCount}, Skipped: ${skippedCount}.`
    );
  } catch (error: any) {
    logError(`A critical error occurred: ${error.message}`);
  } finally {
    if (mongoose.connection.readyState === 1) {
      log("Disconnecting from database...");
      await mongoose.disconnect();
      logSuccess("Database disconnected.");
    }
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  logSuccess(`Player cache warming complete in ${duration} seconds.`);
}

run();
