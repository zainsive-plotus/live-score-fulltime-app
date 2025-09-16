import "server-only";
import { cache } from "react";
import redis from "@/lib/redis";
import axios from "axios";

export interface StaticLeague {
  league: any;
  country: any;
  seasons: any[];
}

// The function now fetches from Redis with an API fallback.
export const getLeagueStaticData = cache(
  async (leagueId: string): Promise<StaticLeague | null> => {
    const cacheKey = `league:static:${leagueId}`;

    try {
      const cachedData = await redis.get(cacheKey);
      if (cachedData) {
        return JSON.parse(cachedData);
      }
    } catch (e) {
      console.error(
        `[data/league-static] Redis GET failed for key ${cacheKey}:`,
        e
      );
    }

    // Fallback: If not in cache, fetch directly from the API and cache it.
    console.warn(
      `[data/league-static] Cache MISS for league ${leagueId}. Fetching from API...`
    );
    try {
      const response = await axios.get<{ response: StaticLeague[] }>(
        `${process.env.NEXT_PUBLIC_API_FOOTBALL_HOST}/leagues`,
        {
          params: { id: leagueId },
          headers: {
            "x-apisports-key": process.env.NEXT_PUBLIC_API_FOOTBALL_KEY,
          },
        }
      );

      const leagueData = response.data.response?.[0];
      if (leagueData) {
        await redis.set(
          cacheKey,
          JSON.stringify(leagueData),
          "EX",
          60 * 60 * 24 * 7
        ); // 7 days
      }
      return leagueData || null;
    } catch (error) {
      console.error(
        `[data/league-static] API fallback failed for league ${leagueId}:`,
        error
      );
      return null;
    }
  }
);
