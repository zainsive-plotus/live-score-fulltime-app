import axios from "axios";
import redis from "@/lib/redis";
import "server-only";
import { cache } from "react";
import Team from "@/models/Team";
import { topLeaguesConfig } from "@/config/topLeaguesConfig";
import dbConnect from "@/lib/dbConnect";

const BASE_URL = process.env.APP_URL || "http://localhost:3000";

const STATIC_CACHE_TTL = 60 * 60 * 24;
const DYNAMIC_CACHE_TTL = 60 * 60 * 6;

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

const apiRequest = async <T>(
  endpoint: string,
  params: object,
  cacheKey: string,
  ttl: number
): Promise<T | null> => {
  try {
    const cachedData = await redis.get(cacheKey);
    if (cachedData) {
      return JSON.parse(cachedData);
    }
  } catch (e) {
    console.error(`[data/team] Redis GET failed for key ${cacheKey}.`, e);
  }

  try {
    const options = {
      method: "GET",
      url: `${process.env.NEXT_PUBLIC_API_FOOTBALL_HOST}/${endpoint}`,
      params,
      headers: { "x-apisports-key": process.env.NEXT_PUBLIC_API_FOOTBALL_KEY },
      timeout: 8000,
    };
    const response = await axios.request(options);
    const data = response.data.response;

    if (data && (!Array.isArray(data) || data.length > 0)) {
      await redis.set(cacheKey, JSON.stringify(data), "EX", ttl);
    }
    return data;
  } catch (error: any) {
    console.error(
      `[data/team] API fetch failed for key ${cacheKey}:`,
      error.code || error.message
    );
    try {
      const cachedData = await redis.get(cacheKey);
      if (cachedData) {
        console.warn(`[data/team] ✓ Serving STALE data for key: ${cacheKey}`);
        return JSON.parse(cachedData);
      }
    } catch (cacheError) {
      console.error(
        `[data/team] ✗ CRITICAL: Redis lookup failed during fallback for key ${cacheKey}.`,
        cacheError
      );
    }
    return null;
  }
};

// VVVV EXPORT STATEMENTS ARE CORRECTED HERE VVVV

export const getTeamInfo = cache(async (teamId: string) => {
  const data = await apiRequest<any[]>(
    "teams",
    { id: teamId },
    `team:info:${teamId}`,
    STATIC_CACHE_TTL
  );
  return data?.[0] ?? null;
});

export const getTeamSquad = cache(async (teamId: string) => {
  const data = await apiRequest<any[]>(
    "players/squads",
    { team: teamId },
    `team:squad:${teamId}`,
    STATIC_CACHE_TTL
  );
  // The API response for squads is an array containing one object with a 'players' key.
  return data?.[0]?.players ?? [];
});

export const getTeamFixtures = cache(async (teamId: string) => {
  return await apiRequest<any[]>(
    "fixtures",
    { team: teamId, last: 20 },
    `team:fixtures:${teamId}`,
    DYNAMIC_CACHE_TTL
  );
});

export const getTeamStandings = cache(async (teamId: string) => {
  const season = new Date().getFullYear().toString();
  const cacheKey = `team:standings:v3:${teamId}:${season}`;

  try {
    const cachedData = await redis.get(cacheKey);
    if (cachedData) {
      return JSON.parse(cachedData);
    }

    const teamLeaguesResponse = await apiRequest<any[]>(
      "leagues",
      { team: teamId },
      `team:leagues:${teamId}`,
      STATIC_CACHE_TTL
    );
    if (!teamLeaguesResponse || teamLeaguesResponse.length === 0) {
      console.warn(
        `[data/team] No leagues found for team ${teamId}. Cannot fetch standings.`
      );
      return null;
    }

    const primaryLeagueInfo = teamLeaguesResponse
      .filter(
        (item) =>
          item.league.type === "League" &&
          item.seasons.some((s: any) => s.year.toString() === season)
      )
      .sort((a, b) => a.league.id - b.league.id)[0];

    if (!primaryLeagueInfo) {
      console.warn(
        `[data/team] No primary "League" type competition found for team ${teamId} for the ${season} season.`
      );
      return null;
    }

    const { league } = primaryLeagueInfo;

    const standingsData = await apiRequest<any[]>(
      "standings",
      { league: league.id, season: season },
      `standings:${league.id}:${season}`,
      DYNAMIC_CACHE_TTL
    );

    await redis.set(
      cacheKey,
      JSON.stringify(standingsData),
      "EX",
      DYNAMIC_CACHE_TTL
    );
    return standingsData;
  } catch (error) {
    console.error(
      `[data/team] CRITICAL: Failed to execute getTeamStandings for team ${teamId}`,
      error
    );
    try {
      const cachedData = await redis.get(cacheKey);
      if (cachedData) return JSON.parse(cachedData);
    } catch (e) {}
    return null;
  }
});

// This is a helper function that bundles the calls for the main page.
export async function getTeamPageData(teamId: string) {
  const [teamInfo, squad, fixtures, standings] = await Promise.all([
    getTeamInfo(teamId),
    getTeamSquad(teamId),
    getTeamFixtures(teamId),
    getTeamStandings(teamId),
  ]);

  if (!teamInfo) {
    return null;
  }

  return { teamInfo, squad, fixtures, standings };
}
