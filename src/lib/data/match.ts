// ===== src/lib/data/match.ts =====

import "server-only";
import axios from "axios";
// ***** FIX: Import from the new, dedicated prediction engine file *****
import {
  calculateCustomPrediction,
  convertPercentageToOdds,
} from "@/lib/prediction-engine";

export const fetchAllDataForFixture = async (fixtureId: string | number) => {
  const options = (endpoint: string, params: object) => ({
    method: "GET",
    url: `${process.env.NEXT_PUBLIC_API_FOOTBALL_HOST}/${endpoint}`,
    params,
    headers: { "x-apisports-key": process.env.NEXT_PUBLIC_API_FOOTBALL_KEY },
  });

  const fixtureResponse = await axios.request(
    options("fixtures", { id: fixtureId })
  );
  const fixtureData = fixtureResponse.data.response[0];

  if (!fixtureData) {
    throw new Error(`Fixture not found with ID: ${fixtureId}`);
  }

  const { league, teams } = fixtureData;
  const { home: homeTeam, away: awayTeam } = teams;

  const [
    eventsResponse,
    statsResponse,
    h2hResponse,
    predictionResponse,
    homeStatsResponse,
    awayStatsResponse,
    oddsResponse,
    standingsResponse,
  ] = await Promise.all([
    axios.request(options("fixtures/events", { fixture: fixtureId })),
    axios.request(options("fixtures/statistics", { fixture: fixtureId })),
    axios.request(
      options("fixtures/headtohead", { h2h: `${homeTeam.id}-${awayTeam.id}` })
    ),
    axios.request(options("predictions", { fixture: fixtureId })),
    axios.request(
      options("teams/statistics", {
        league: league.id,
        season: league.season,
        team: homeTeam.id,
      })
    ),
    axios.request(
      options("teams/statistics", {
        league: league.id,
        season: league.season,
        team: awayTeam.id,
      })
    ),
    axios.request(
      options("odds", { fixture: fixtureId, bookmaker: "8", bet: "1" })
    ),
    axios.request(
      options("standings", { league: league.id, season: league.season })
    ),
  ]);

  const standings =
    standingsResponse.data.response[0]?.league?.standings[0] || [];
  const homeTeamRank = standings.find(
    (s: any) => s.team.id === homeTeam.id
  )?.rank;
  const awayTeamRank = standings.find(
    (s: any) => s.team.id === awayTeam.id
  )?.rank;

  const customPredictionPercentages = calculateCustomPrediction(
    h2hResponse.data.response,
    homeStatsResponse.data.response,
    awayStatsResponse.data.response,
    homeTeam.id,
    homeTeamRank,
    awayTeamRank,
    eventsResponse.data.response,
    fixtureData.fixture.status.short
  );

  const customPredictionOdds = customPredictionPercentages
    ? {
        home: convertPercentageToOdds(customPredictionPercentages.home),
        draw: convertPercentageToOdds(customPredictionPercentages.draw),
        away: convertPercentageToOdds(customPredictionPercentages.away),
      }
    : null;

  return {
    fixture: fixtureData,
    events: eventsResponse.data.response,
    statistics: statsResponse.data.response,
    h2h: h2hResponse.data.response,
    analytics: {
      prediction: predictionResponse.data.response[0] ?? null,
      homeTeamStats: homeStatsResponse.data.response ?? null,
      awayTeamStats: awayStatsResponse.data.response ?? null,
      customPrediction: customPredictionPercentages,
      customOdds: customPredictionOdds,
      bookmakerOdds: oddsResponse.data.response[0]?.bookmakers ?? [],
    },
  };
};
