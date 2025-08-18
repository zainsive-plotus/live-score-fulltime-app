// ===== src/app/api/teams/paginated/route.ts =====

import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Team from "@/models/Team";

export async function GET(request: Request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "21"); // Default to 21 items per page
    const searchQuery = searchParams.get("search") || "";

    const skip = (page - 1) * limit;

    const query: any = {};
    if (searchQuery.length >= 3) {
      const regex = new RegExp(searchQuery, "i");
      query.$or = [
        { name: { $regex: regex } },
        { country: { $regex: regex } },
        { venueName: { $regex: regex } },
        { venueCity: { $regex: regex } },
      ];
    }

    const [teams, totalCount] = await Promise.all([
      Team.find(query)
        .sort({ country: 1, name: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Team.countDocuments(query),
    ]);

    // Structure the data to match the old format for the TeamDirectoryCard component
    const formattedTeams = teams.map((team) => ({
      team: {
        id: team.teamId,
        name: team.name,
        logo: team.logoUrl,
        country: team.country,
        founded: team.founded,
      },
      venue: {
        name: team.venueName,
        city: team.venueCity,
      },
    }));

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      teams: formattedTeams,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
      },
    });
  } catch (error: any) {
    console.error("[API/teams/paginated] Error fetching teams:", error);
    return NextResponse.json(
      { error: "Server error fetching paginated teams." },
      { status: 500 }
    );
  }
}
