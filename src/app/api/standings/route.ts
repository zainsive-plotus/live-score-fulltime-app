// ===== src/app/api/standings/route.ts =====

import { NextResponse } from "next/server";
import axios from "axios";
import { generateLeagueSlug } from "@/lib/generate-league-slug";
import redis from "@/lib/redis";

const CACHE_TTL_SECONDS = 60 * 60 * 2; // Cache for 2 hours

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const leagueId = searchParams.get("league");
  // ***** FIX: Read the season from the search params, defaulting to the current year *****
  const season =
    searchParams.get("season") || new Date().getFullYear().toString();

  if (!leagueId) {
    return NextResponse.json(
      { error: "League ID is required" },
      { status: 400 }
    );
  }

  // ***** FIX: Include season in the cache key for uniqueness *****
  const cacheKey = `standings:detailed:${leagueId}:${season}`;

  try {
    const cachedData = await redis.get(cacheKey);
    if (cachedData) {
      return NextResponse.json(JSON.parse(cachedData));
    }

    const options = (endpoint: string, params: object) => ({
      method: "GET",
      url: `${process.env.NEXT_PUBLIC_API_FOOTBALL_HOST}/${endpoint}`,
      params,
      headers: { "x-apisports-key": process.env.NEXT_PUBLIC_API_FOOTBALL_KEY },
    });

    const [standingsResponse, topScorersResponse, leagueDetailsResponse] =
      await Promise.all([
        axios.request(
          options("standings", { league: leagueId, season: season })
        ),
        axios.request(
          options("players/topscorers", { league: leagueId, season: season })
        ),
        axios.request(options("leagues", { id: leagueId })),
      ]);

    if (
      !standingsResponse.data.response ||
      standingsResponse.data.response.length === 0
    ) {
      const emptyResponse = {
        league: null,
        standings: [],
        leagueStats: null,
        topScorer: null,
      };
      await redis.set(
        cacheKey,
        JSON.stringify(emptyResponse),
        "EX",
        CACHE_TTL_SECONDS
      );
      return NextResponse.json(emptyResponse);
    }

    const data = standingsResponse.data.response[0];
    const topScorer = topScorersResponse.data.response?.[0] || null;
    const leagueDetails = leagueDetailsResponse.data.response?.[0] || {};

    const allStandings = data.league.standings.flat();
    const totalMatchesPlayed =
      allStandings.reduce(
        (sum: number, team: any) => sum + team.all.played,
        0
      ) / 2;
    const totalGoalsScored = allStandings.reduce(
      (sum: number, team: any) => sum + team.all.goals.for,
      0
    );
    const avgGoalsPerMatch =
      totalMatchesPlayed > 0
        ? (totalGoalsScored / totalMatchesPlayed).toFixed(2)
        : "0.00";

    const leagueStats = {
      totalGoals: totalGoalsScored,
      avgGoals: avgGoalsPerMatch,
      totalMatches: Math.floor(totalMatchesPlayed),
    };

    const transformedData = {
      league: {
        id: data.league.id,
        name: data.league.name,
        country: data.league.country,
        logo: data.league.logo,
        type: data.league.type,
        season: data.league.season,
        // Add all available seasons to the response for the dropdown
        seasons: leagueDetails.seasons
          ?.map((s: any) => s.year)
          .sort((a: number, b: number) => b - a) || [season],
        href: generateLeagueSlug(data.league.name, data.league.id),
      },
      standings: data.league.standings,
      leagueStats,
      topScorer,
    };

    await redis.set(
      cacheKey,
      JSON.stringify(transformedData),
      "EX",
      CACHE_TTL_SECONDS
    );

    return NextResponse.json(transformedData);
  } catch (error) {
    console.error(
      `[API/standings] Error for league ${leagueId} season ${season}:`,
      error
    );
    return NextResponse.json(
      { error: "Failed to fetch standings data" },
      { status: 500 }
    );
  }
}
