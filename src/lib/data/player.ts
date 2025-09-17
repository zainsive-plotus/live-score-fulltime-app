// ===== src/lib/data/player.ts =====
import "server-only";
import axios from "axios";
import redis from "@/lib/redis";

const API_HOST = process.env.NEXT_PUBLIC_API_FOOTBALL_HOST;
const API_KEY = process.env.NEXT_PUBLIC_API_FOOTBALL_KEY;
const CACHE_TTL = 60 * 60 * 24; // 24 hours

const apiRequest = async <T>(
  endpoint: string,
  params: object,
  cacheKey: string
): Promise<T | null> => {
  try {
    const cachedData = await redis.get(cacheKey);
    if (cachedData) return JSON.parse(cachedData);
  } catch (e) {
    console.error(`[data/player] Redis GET failed for key ${cacheKey}:`, e);
  }

  try {
    const response = await axios.get<{ response: T }>(
      `${API_HOST}/${endpoint}`,
      {
        params,
        headers: { "x-apisports-key": API_KEY },
        timeout: 8000,
      }
    );
    const data = response.data.response;
    if (data && (!Array.isArray(data) || data.length > 0)) {
      await redis.set(cacheKey, JSON.stringify(data), "EX", CACHE_TTL);
    }
    return data;
  } catch (error) {
    console.error(
      `[data/player] API fetch failed for ${endpoint} with key ${cacheKey}:`,
      error
    );
    return null;
  }
};

export const getPlayerStats = (playerId: string, season: string) =>
  apiRequest<any[]>(
    "players",
    { id: playerId, season },
    `player:stats:${playerId}:${season}`
  );

export const getPlayerTransfers = (playerId: string) =>
  apiRequest<any[]>(
    "transfers",
    { player: playerId },
    `player:transfers:${playerId}`
  );

export const getPlayerTrophies = (playerId: string) =>
  apiRequest<any[]>(
    "trophies",
    { player: playerId },
    `player:trophies:${playerId}`
  );

export const getPlayerPageData = async (playerId: string) => {
  const season = new Date().getFullYear().toString();

  const [stats, transfers, trophies] = await Promise.all([
    getPlayerStats(playerId, season),
    getPlayerTransfers(playerId),
    getPlayerTrophies(playerId),
  ]);

  // The 'stats' endpoint is the most crucial; if it fails, the player might not exist for the current season.
  if (!stats || stats.length === 0) {
    return null;
  }

  return {
    stats: stats[0], // The stats endpoint returns an array with one player object
    transfers,
    trophies,
  };
};
