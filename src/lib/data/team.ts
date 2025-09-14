import "server-only";
import dbConnect from "@/lib/dbConnect";
import Team from "@/models/Team";
import { topLeaguesConfig } from "@/config/topLeaguesConfig";
import axios from "axios";

const BASE_URL = process.env.APP_URL || "http://localhost:3000";

// This logic is moved from your API route to be reusable.
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
    console.error("[data/teams] Failed to fetch popular teams:", error);
    return [];
  }
};

const formatTeamsForResponse = (teams: any[]) => {
  return teams.map((teamData) => {
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

interface GetPaginatedTeamsParams {
  page?: number;
  limit?: number;
  searchQuery?: string;
}

export const getPaginatedTeams = async ({
  page = 1,
  limit = 21,
  searchQuery = "",
}: GetPaginatedTeamsParams) => {
  await dbConnect();
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

  if (page === 1 && !searchQuery) {
    // Special logic for the first page to show popular teams
    const popularTeams = await getPopularTeams();
    const popularTeamIds = new Set(popularTeams.map((t) => t.team.id));
    const neededRegularTeams = limit - popularTeams.length;

    const regularTeams =
      neededRegularTeams > 0
        ? await Team.find({ teamId: { $nin: Array.from(popularTeamIds) } })
            .sort({ name: 1 })
            .limit(neededRegularTeams)
            .lean()
        : [];

    const combinedList = [...popularTeams, ...regularTeams];
    combinedList.sort((a, b) => {
      const aHasImage = !!(a.team?.logo || a.logoUrl);
      const bHasImage = !!(b.team?.logo || b.logoUrl);
      if (aHasImage !== bHasImage) return aHasImage ? -1 : 1;
      return 0;
    });

    teams = combinedList.slice(0, limit);
    totalCount = await Team.countDocuments({});
  } else {
    // Standard logic for searching and subsequent pages
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

  return {
    teams: formattedTeams,
    pagination: { currentPage: page, totalPages, totalCount },
  };
};
