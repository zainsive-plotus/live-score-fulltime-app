// ===== src/app/api/admin/teams/sync/route.ts =====

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/dbConnect";
import League from "@/models/League";
import Team from "@/models/Team";
import axios from "axios";
import redis from "@/lib/redis";

const fetchTeamsForLeague = async (leagueId: number, season: number) => {
  try {
    const options = {
      method: "GET",
      url: `${process.env.NEXT_PUBLIC_API_FOOTBALL_HOST}/teams`,
      params: { league: leagueId, season },
      headers: { "x-apisports-key": process.env.NEXT_PUBLIC_API_FOOTBALL_KEY },
      timeout: 10000,
    };
    const response = await axios.request(options);
    return response.data.response;
  } catch (error) {
    console.error(
      `[Teams Sync] Failed to fetch teams for league ${leagueId}:`,
      error
    );
    return []; // Return empty array on failure to not stop the whole process
  }
};

export async function POST() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    await dbConnect();
    const season = new Date().getFullYear();

    console.log("[Teams Sync] Fetching all leagues from the database...");
    const allLeagues = await League.find({}).select("leagueId").lean();
    const leagueIds = allLeagues.map((l) => l.leagueId);
    console.log(
      `[Teams Sync] Found ${leagueIds.length} leagues to process for season ${season}.`
    );

    let allTeamsFromApi = [];
    for (let i = 0; i < leagueIds.length; i++) {
      const leagueId = leagueIds[i];
      console.log(
        `[Teams Sync] Fetching teams for league ${i + 1}/${
          leagueIds.length
        } (ID: ${leagueId})...`
      );
      const teams = await fetchTeamsForLeague(leagueId, season);
      allTeamsFromApi.push(...teams);
      // Small delay to respect API rate limits
      await new Promise((resolve) => setTimeout(resolve, 300));
    }

    console.log(
      `[Teams Sync] Fetched a total of ${allTeamsFromApi.length} team entries from the API (duplicates will be merged).`
    );
    const uniqueTeams = Array.from(
      new Map(allTeamsFromApi.map((item) => [item.team.id, item])).values()
    );
    console.log(
      `[Teams Sync] Found ${uniqueTeams.length} unique teams to process.`
    );

    const bulkOps = uniqueTeams.map((item: any) => {
      const { team, venue } = item;
      const teamData = {
        teamId: team.id,
        name: team.name,
        code: team.code,
        country: team.country,
        founded: team.founded,
        national: team.national,
        logoUrl: team.logo,
        venueId: venue.id,
        venueName: venue.name,
        venueAddress: venue.address,
        venueCity: venue.city,
        venueCapacity: venue.capacity,
        venueSurface: venue.surface,
        venueImageUrl: venue.image,
      };

      return {
        updateOne: {
          filter: { teamId: team.id },
          update: { $set: teamData },
          upsert: true,
        },
      };
    });

    if (bulkOps.length > 0) {
      console.log(
        `[Teams Sync] Performing bulk write operation for ${bulkOps.length} teams...`
      );
      const result = await Team.bulkWrite(bulkOps);
      console.log(
        `[Teams Sync] Bulk write complete. Upserted: ${result.upsertedCount}, Modified: ${result.modifiedCount}.`
      );

      const redisKeys = await redis.keys("teams:*");
      if (redisKeys.length > 0) {
        await redis.del(...redisKeys);
        console.log(
          `[Teams Sync] Invalidated ${redisKeys.length} team-related Redis caches.`
        );
      }

      const count = result.upsertedCount + result.modifiedCount;
      return NextResponse.json({
        message: `Teams synchronized successfully! Processed ${count} teams.`,
        count,
      });
    }

    return NextResponse.json({ message: "No teams to synchronize.", count: 0 });
  } catch (error: any) {
    console.error("[Teams Sync] CRITICAL ERROR during synchronization:", error);
    return NextResponse.json(
      { error: "Server error during team synchronization." },
      { status: 500 }
    );
  }
}
