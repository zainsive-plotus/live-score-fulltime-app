import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Team from "@/models/Team";
import { topLeaguesConfig } from "@/config/topLeaguesConfig";
import axios from "axios";

const BASE_URL =
  process.env.NEXT_PUBLIC_PUBLIC_APP_URL || "http://localhost:3000";

// Helper to get popular teams based on your config
const getPopularTeams = async () => {
  try {
    const season = new Date().getFullYear();
    const popularLeagueIds = topLeaguesConfig
      .sort((a, b) => a.priority - b.priority)
      .slice(0, 6)
      .map((l) => l.leagueId);

    const teamPromises = popularLeagueIds.map((leagueId) =>
      axios.get(`${BASE_URL}/api/teams?league=${leagueId}&season=${season}`)
    );

    const responses = await Promise.allSettled(teamPromises);

    const allTeams = responses
      .filter((res) => res.status === "fulfilled" && res.value.data)
      .flatMap((res) => (res as PromiseFulfilledResult<any>).value.data);

    return Array.from(
      new Map(allTeams.map((item) => [item.team.id, item])).values()
    );
  } catch (error) {
    console.error(
      "[API/teams/paginated] Failed to fetch popular teams:",
      error
    );
    return [];
  }
};

const formatTeamsForResponse = (teams: any[]) => {
  return teams.map((teamData) => {
    // The data can come from the DB (Team model) or the API (getPopularTeams)
    // This standardizes the output structure.
    const team = teamData.team || teamData;
    const venue = teamData.venue || team;
    return {
      team: {
        id: team.teamId || team.id,
        name: team.name,
        logo: team.logoUrl || team.logo,
        country: team.country,
        founded: team.founded,
      },
      venue: {
        name: venue.venueName || venue.name,
        city: venue.venueCity || venue.city,
      },
    };
  });
};

export async function GET(request: Request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "21");
    const searchQuery = searchParams.get("search") || "";

    const skip = (page - 1) * limit;

    let teams = [];
    let totalCount = 0;

    const searchFilter =
      searchQuery.length >= 3
        ? {
            $or: [
              { name: { $regex: new RegExp(searchQuery, "i") } },
              { country: { $regex: new RegExp(searchQuery, "i") } },
            ],
          }
        : {};

    // ** THE NEW LOGIC IS HERE **
    if (page === 1 && !searchQuery) {
      // For the first page, fetch popular teams and merge them
      const popularTeams = await getPopularTeams();
      const popularTeamIds = new Set(popularTeams.map((t) => t.team.id));

      const neededRegularTeams = limit - popularTeams.length;

      const regularTeams =
        neededRegularTeams > 0
          ? await Team.find({
              teamId: { $nin: Array.from(popularTeamIds) },
            })
              .sort({ name: 1 }) // Sort alphabetically as a fallback
              .limit(neededRegularTeams)
              .lean()
          : [];

      // Combine and apply the final sorting logic
      const combinedList = [...popularTeams, ...regularTeams];
      combinedList.sort((a, b) => {
        const aHasImage = !!(a.team?.logo || a.logoUrl);
        const bHasImage = !!(b.team?.logo || b.logoUrl);
        if (aHasImage !== bHasImage) return aHasImage ? -1 : 1;
        return 0; // Maintain relative order after image check
      });

      teams = combinedList.slice(0, limit);
      totalCount = await Team.countDocuments({});
    } else {
      // For all other pages or searches, use standard pagination
      [teams, totalCount] = await Promise.all([
        Team.find(searchFilter)
          .sort({ country: 1, name: 1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Team.countDocuments(searchFilter),
      ]);
    }

    const formattedTeams = formatTeamsForResponse(teams);
    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      teams: formattedTeams,
      pagination: { currentPage: page, totalPages, totalCount },
    });
  } catch (error: any) {
    console.error("[API/teams/paginated] Server error:", error);
    return NextResponse.json(
      { error: "Server error fetching paginated teams." },
      { status: 500 }
    );
  }
}
