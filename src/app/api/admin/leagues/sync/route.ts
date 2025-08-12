// ===== src/app/api/admin/leagues/sync/route.ts =====

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/dbConnect";
import League from "@/models/League";
import axios from "axios";
import redis from "@/lib/redis";

const fetchAllExternalLeagues = async () => {
  try {
    const options = {
      method: "GET",
      url: `${process.env.NEXT_PUBLIC_API_FOOTBALL_HOST}/leagues`,
      headers: { "x-apisports-key": process.env.NEXT_PUBLIC_API_FOOTBALL_KEY },
    };
    const response = await axios.request(options);
    return response.data.response;
  } catch (error) {
    console.error(
      "[API/admin/leagues/sync] Failed to fetch from external API:",
      error
    );
    throw new Error("Failed to fetch leagues from the external API.");
  }
};

export async function POST() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    await dbConnect();

    console.log("Starting league synchronization process...");
    const externalLeagues = await fetchAllExternalLeagues();
    console.log(
      `Fetched ${externalLeagues.length} leagues from the external API.`
    );

    const bulkOps = externalLeagues.map((item: any) => {
      const { league, country, seasons } = item;
      const leagueData = {
        leagueId: league.id,
        name: league.name,
        type: league.type,
        logoUrl: league.logo,
        countryName: country.name,
        countryCode: country.code,
        countryFlagUrl: country.flag,
        seasons: seasons.map((s: any) => ({
          year: s.year,
          start: s.start,
          end: s.end,
          current: s.current,
        })),
      };

      return {
        updateOne: {
          filter: { leagueId: league.id },
          update: { $set: leagueData },
          upsert: true,
        },
      };
    });

    if (bulkOps.length > 0) {
      console.log("Performing bulk write operation on the database...");
      const result = await League.bulkWrite(bulkOps);
      console.log("Bulk write operation completed.", result);

      // --- THIS IS THE FIX ---
      // The key pattern is now correct to invalidate all database-driven league caches.
      if (redis && typeof redis.keys === "function") {
        const redisKeys = await redis.keys("leagues:db:*");
        if (redisKeys && redisKeys.length > 0) {
          await redis.del(...redisKeys);
          console.log(
            `Invalidated ${redisKeys.length} league-related Redis caches.`
          );
        }
      } else {
        console.warn(
          "[API/admin/leagues/sync] Redis client does not support .keys() method. Skipping cache invalidation."
        );
      }
      // --- END OF FIX ---

      const count = result.upsertedCount + result.modifiedCount;
      return NextResponse.json({
        message: "Leagues synchronized successfully!",
        count,
      });
    }

    return NextResponse.json({
      message: "No leagues to synchronize.",
      count: 0,
    });
  } catch (error: any) {
    console.error(
      "[API/admin/leagues/sync] Error during synchronization:",
      error
    );
    return NextResponse.json(
      { error: "Server error during league synchronization." },
      { status: 500 }
    );
  }
}
