// ===== src/app/api/predictions/upcoming/route.ts =====

import { NextResponse } from "next/server";
import axios from "axios";
import { format } from "date-fns";
import { getH2H, getTeamStats, getStandings } from "@/lib/data/match";
import { calculateCustomPrediction } from "@/lib/prediction-engine";
import redis from "@/lib/redis";

const apiRequest = async (endpoint: string, params: object) => {
  const options = {
    method: "GET",
    url: `${process.env.NEXT_PUBLIC_API_FOOTBALL_HOST}/${endpoint}`,
    params,
    headers: { "x-apisports-key": process.env.NEXT_PUBLIC_API_FOOTBALL_KEY },
  };
  try {
    const response = await axios.request(options);
    return response.data.response;
  } catch (error) {
    console.error(`[API Predictions] Error fetching ${endpoint}:`, error);
    return [];
  }
};

const getFormFromFixtures = (fixtures: any[], teamId: number): string => {
  if (!fixtures || fixtures.length === 0) return "";
  return fixtures
    .map((match: any) => {
      if (match.teams.home.winner)
        return match.teams.home.id === teamId ? "W" : "L";
      if (match.teams.away.winner)
        return match.teams.away.id === teamId ? "W" : "L";
      return "D";
    })
    .join("");
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "12");

  const todayString = format(new Date(), "yyyy-MM-dd");
  const cacheKey = `predictions:upcoming:all-leagues:v3:${todayString}`; // Incremented cache key

  try {
    const cachedData = await redis.get(cacheKey);
    if (cachedData) {
      console.log(
        `[API Predictions] Serving all of today's predictions from cache.`
      );
      const allEnrichedFixtures = JSON.parse(cachedData);

      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedFixtures = allEnrichedFixtures.slice(startIndex, endIndex);
      const hasNextPage = endIndex < allEnrichedFixtures.length;

      return NextResponse.json({
        fixtures: paginatedFixtures,
        nextPage: hasNextPage ? page + 1 : null,
      });
    }

    console.log(
      `[API Predictions] Cache miss. Fetching and calculating all predictions for ${todayString}.`
    );

    const allFixturesToday = await apiRequest("fixtures", {
      date: todayString,
    });

    const upcomingFixtures = allFixturesToday.filter(
      (f: any) => f.fixture.status.short === "NS"
    );

    upcomingFixtures.sort(
      (a: any, b: any) => a.fixture.timestamp - b.fixture.timestamp
    );

    const enrichedFixturesPromises = upcomingFixtures.map(
      async (fixture: any) => {
        const { league, teams } = fixture;
        const { home, away } = teams;

        try {
          const [
            h2h,
            homeTeamStats,
            awayTeamStats,
            standingsResponse,
            homeLast10,
            awayLast10,
          ] = await Promise.all([
            getH2H(home.id, away.id),
            getTeamStats(league.id, league.season, home.id),
            getTeamStats(league.id, league.season, away.id),
            getStandings(league.id, league.season),
            apiRequest("fixtures", { team: home.id, last: 10 }), // Fetch last 10 for home team
            apiRequest("fixtures", { team: away.id, last: 10 }), // Fetch last 10 for away team
          ]);

          const flatStandings =
            standingsResponse?.[0]?.league?.standings?.flat() || [];
          const homeTeamRank = flatStandings.find(
            (s: any) => s.team.id === home.id
          )?.rank;
          const awayTeamRank = flatStandings.find(
            (s: any) => s.team.id === away.id
          )?.rank;

          const prediction = calculateCustomPrediction(
            h2h,
            homeTeamStats,
            awayTeamStats,
            home.id,
            homeTeamRank,
            awayTeamRank,
            null,
            fixture.fixture.status.short
          );

          return {
            ...fixture,
            prediction,
            h2h,
            form: {
              // Pass the new 10-game form strings
              home: getFormFromFixtures(homeLast10, home.id),
              away: getFormFromFixtures(awayLast10, away.id),
            },
          };
        } catch (enrichError) {
          console.error(
            `[API Predictions] Failed to enrich fixture ${fixture.fixture.id}:`,
            enrichError
          );
          return null;
        }
      }
    );

    const allEnrichedFixtures = (
      await Promise.all(enrichedFixturesPromises)
    ).filter(Boolean);

    if (allEnrichedFixtures.length > 0) {
      const now = new Date();
      const endOfDay = new Date(now);
      endOfDay.setHours(23, 59, 59, 999);
      const ttl = Math.floor((endOfDay.getTime() - now.getTime()) / 1000);

      await redis.set(
        cacheKey,
        JSON.stringify(allEnrichedFixtures),
        "EX",
        ttl > 0 ? ttl : 60
      );
      console.log(
        `[API Predictions] Cached ${allEnrichedFixtures.length} predictions for today. TTL: ${ttl}s.`
      );
    }

    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedFixtures = allEnrichedFixtures.slice(startIndex, endIndex);
    const hasNextPage = endIndex < allEnrichedFixtures.length;

    return NextResponse.json({
      fixtures: paginatedFixtures,
      nextPage: hasNextPage ? page + 1 : null,
    });
  } catch (error) {
    console.error("[API Predictions] A critical error occurred:", error);
    return NextResponse.json(
      { error: "Failed to fetch upcoming predictions." },
      { status: 500 }
    );
  }
}
