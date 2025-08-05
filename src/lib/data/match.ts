// ===== src/lib/data/match.ts =====
import { cache } from "react";
import axios from "axios";
import "server-only";
import { calculateCustomPrediction } from "@/lib/prediction-engine";

// Base API request function
const apiRequest = async (endpoint: string, params: object) => {
  const options = {
    method: "GET",
    url: `${process.env.NEXT_PUBLIC_API_FOOTBALL_HOST}/${endpoint}`,
    params,
    headers: { "x-apisports-key": process.env.NEXT_PUBLIC_API_FOOTBALL_KEY },
    timeout: 15000,
  };
  try {
    const response = await axios.request(options);
    return response.data.response;
  } catch (error) {
    console.error(`[API Football Error] Endpoint: ${endpoint}`, error);
    return null;
  }
};

// The single, cached function for the entire page's data needs
export const fetchMatchPageData = cache(async (fixtureId: string) => {
  const fixtureResponse = await apiRequest("fixtures", { id: fixtureId });
  if (!fixtureResponse || fixtureResponse.length === 0) {
    return null;
  }
  const fixture = fixtureResponse[0];
  const { league, teams } = fixture;
  const { home: homeTeam, away: awayTeam } = teams;

  // Fetch all other data in a controlled, parallel batch
  const [
    statistics,
    h2h,
    homeTeamStats,
    awayTeamStats,
    standingsResponse,
    bookmakerOdds,
  ] = await Promise.all([
    apiRequest("fixtures/statistics", { fixture: fixtureId }),
    apiRequest("fixtures/headtohead", { h2h: `${homeTeam.id}-${awayTeam.id}` }),
    apiRequest("teams/statistics", {
      league: league.id,
      season: league.season,
      team: homeTeam.id,
    }),
    apiRequest("teams/statistics", {
      league: league.id,
      season: league.season,
      team: awayTeam.id,
    }),
    apiRequest("standings", { league: league.id, season: league.season }),
    apiRequest("odds", { fixture: fixtureId, bet: "1", bookmaker: "8" }),
  ]);

  const standings = standingsResponse?.[0]?.league?.standings[0] || [];
  const homeTeamRank = standings.find(
    (s: any) => s.team.id === homeTeam.id
  )?.rank;
  const awayTeamRank = standings.find(
    (s: any) => s.team.id === awayTeam.id
  )?.rank;

  const customPrediction = calculateCustomPrediction(
    h2h,
    homeTeamStats,
    awayTeamStats,
    homeTeam.id,
    homeTeamRank,
    awayTeamRank,
    null,
    fixture.fixture.status.short
  );

  return {
    fixture,
    statistics,
    h2h,
    standings: standingsResponse,
    analytics: {
      homeTeamStats,
      awayTeamStats,
      customPrediction,
      bookmakerOdds: bookmakerOdds?.[0]?.bookmakers ?? [],
    },
  };
});
