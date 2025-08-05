// ===== src/lib/data/match.ts =====
import { cache } from "react";
import axios from "axios";
import "server-only";
import { calculateCustomPrediction } from "@/lib/prediction-engine";

// Base API request function - not cached itself
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

// --- Create smaller, individually cached functions for each data type ---

export const getFixture = cache((fixtureId: string) =>
  apiRequest("fixtures", { id: fixtureId })
);
export const getH2H = cache((homeTeamId: number, awayTeamId: number) =>
  apiRequest("fixtures/headtohead", { h2h: `${homeTeamId}-${awayTeamId}` })
);
export const getStatistics = cache((fixtureId: string) =>
  apiRequest("fixtures/statistics", { fixture: fixtureId })
);
export const getTeamStats = cache(
  (leagueId: number, season: number, teamId: number) =>
    apiRequest("teams/statistics", { league: leagueId, season, team: teamId })
);
export const getBookmakerOdds = cache((fixtureId: string) =>
  apiRequest("odds", { fixture: fixtureId, bet: "1", bookmaker: "8" })
);
export const getStandings = cache((leagueId: number, season: number) =>
  apiRequest("standings", { league: leagueId, season })
);

// A function to get the custom prediction data, which itself uses other cached functions
export const getCustomPredictionData = cache(async (fixtureId: string) => {
  const fixtureData = await getFixture(fixtureId);
  if (!fixtureData || fixtureData.length === 0) return null;

  const { league, teams } = fixtureData[0];
  const { home, away } = teams;

  // These subsequent calls will be instantly resolved from cache if already fetched
  const [h2h, homeTeamStats, awayTeamStats, standingsResponse] =
    await Promise.all([
      getH2H(home.id, away.id),
      getTeamStats(league.id, league.season, home.id),
      getTeamStats(league.id, league.season, away.id),
      getStandings(league.id, league.season),
    ]);

  const standings = standingsResponse?.[0]?.league?.standings[0] || [];
  const homeTeamRank = standings.find((s: any) => s.team.id === home.id)?.rank;
  const awayTeamRank = standings.find((s: any) => s.team.id === away.id)?.rank;

  const prediction = calculateCustomPrediction(
    h2h,
    homeTeamStats,
    awayTeamStats,
    home.id,
    homeTeamRank,
    awayTeamRank,
    null,
    fixtureData[0].fixture.status.short
  );

  return { prediction, homeTeamStats, awayTeamStats };
});
