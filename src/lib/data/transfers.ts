// ===== src/lib/data/transfers.ts =====

import "server-only";
import axios from "axios";
import redis from "@/lib/redis";

// --- Configuration ---
const API_HOST = process.env.NEXT_PUBLIC_API_FOOTBALL_HOST;
const API_KEY = process.env.NEXT_PUBLIC_API_FOOTBALL_KEY;
const CACHE_KEY_PREFIX = "transfers:team:v1:"; // Added versioning to cache key
const CACHE_TTL_SECONDS = 60 * 60 * 24; // 24 hours
const CACHE_TTL_EMPTY_SECONDS = 60 * 60; // 1 hour for empty results

// --- Type Definitions for a cleaner data structure ---

export interface CleanedTransfer {
  playerName: string;
  playerPhoto: string;
  playerId: number;
  date: string;
  type: string | null;
  teamIn: {
    name: string;
    logo: string;
  };
  teamOut: {
    name: string;
    logo: string;
  };
}

interface ApiTransferMovement {
  date: string;
  type: string | null;
  teams: {
    in: { id: number; name: string; logo: string };
    out: { id: number; name: string; logo: string };
  };
}

interface ApiTransferResponse {
  player: {
    id: number;
    name: string;
  };
  update: string;
  transfers: ApiTransferMovement[];
}

/**
 * Fetches and caches transfer data for a specific team.
 * The data is cleaned, sorted, and stored in Redis for 24 hours.
 *
 * @param teamId The ID of the team to fetch transfers for.
 * @returns A promise that resolves to an array of cleaned transfer data, or null if an error occurs.
 */
export async function getTeamTransfers(
  teamId: string
): Promise<CleanedTransfer[] | null> {
  if (!API_HOST || !API_KEY) {
    console.error("[data/transfers] API credentials are not configured.");
    throw new Error("API credentials are not configured.");
  }

  const cacheKey = `${CACHE_KEY_PREFIX}${teamId}`;

  try {
    // 1. Check Redis cache first
    const cachedData = await redis.get(cacheKey);
    if (cachedData) {
      return JSON.parse(cachedData);
    }

    // 2. Fetch from third-party API if cache misses
    const options = {
      method: "GET",
      url: `${API_HOST}/transfers`,
      params: { team: teamId },
      headers: { "x-apisports-key": API_KEY },
      timeout: 10000,
    };

    const response = await axios.request(options);
    const apiResponse: ApiTransferResponse[] = response.data.response;

    if (!apiResponse || apiResponse.length === 0) {
      // Cache an empty result to prevent repeated failed lookups
      await redis.set(
        cacheKey,
        JSON.stringify([]),
        "EX",
        CACHE_TTL_EMPTY_SECONDS
      );
      return [];
    }

    // 3. Transform the data into a clean, flat structure
    const cleanedTransfers: CleanedTransfer[] = apiResponse.flatMap((item) =>
      item.transfers.map((transfer) => ({
        playerName: item.player.name,
        playerId: item.player.id,
        playerPhoto: `https://media.api-sports.io/football/players/${item.player.id}.png`,
        date: transfer.date,
        type: transfer.type,
        teamIn: transfer.teams.in,
        teamOut: transfer.teams.out,
      }))
    );

    // 4. Sort transfers by date, newest first
    cleanedTransfers.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    // 5. Store the clean data in Redis and return it
    await redis.set(
      cacheKey,
      JSON.stringify(cleanedTransfers),
      "EX",
      CACHE_TTL_SECONDS
    );

    return cleanedTransfers;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error(
        `[data/transfers] API error for team ${teamId}:`,
        error.message
      );
    } else {
      console.error(
        `[data/transfers] An unexpected error occurred for team ${teamId}:`,
        error
      );
    }
    return null;
  }
}
