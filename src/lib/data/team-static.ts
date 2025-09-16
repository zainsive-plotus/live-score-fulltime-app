import "server-only";
import { cache } from "react";
import redis from "@/lib/redis";
import axios from "axios";

interface TeamStaticData {
  team: any;
  venue: any;
}

// The function now fetches from Redis with an API fallback.
export const getTeamStaticData = cache(
  async (teamId: string): Promise<TeamStaticData | null> => {
    const cacheKey = `team:static:${teamId}`;

    try {
      const cachedData = await redis.get(cacheKey);
      if (cachedData) {
        return JSON.parse(cachedData);
      }
    } catch (e) {
      console.error(
        `[data/team-static] Redis GET failed for key ${cacheKey}:`,
        e
      );
    }

    // Fallback: If not in cache, fetch directly from the API and cache it.
    console.warn(
      `[data/team-static] Cache MISS for team ${teamId}. Fetching from API...`
    );
    try {
      const response = await axios.get<{ response: TeamStaticData[] }>(
        `${process.env.NEXT_PUBLIC_API_FOOTBALL_HOST}/teams`,
        {
          params: { id: teamId },
          headers: {
            "x-apisports-key": process.env.NEXT_PUBLIC_API_FOOTBALL_KEY,
          },
        }
      );

      const teamData = response.data.response?.[0];
      if (teamData) {
        // Set cache for a long duration, as this data is static.
        await redis.set(
          cacheKey,
          JSON.stringify(teamData),
          "EX",
          60 * 60 * 24 * 7
        ); // 7 days
      }
      return teamData || null;
    } catch (error) {
      console.error(
        `[data/team-static] API fallback failed for team ${teamId}:`,
        error
      );
      return null;
    }
  }
);
