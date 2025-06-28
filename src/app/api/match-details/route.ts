// src/app/api/match-details/route.ts

import { NextResponse } from "next/server";
import axios from "axios";

// ====================================================================
// --- FANSKOR PREDICTION ENGINE V3.0 (Weather Removed) ---
// ====================================================================
const calculateCustomPrediction = (
  h2h: any[],
  homeTeamStats: any,
  awayTeamStats: any,
  homeTeamId: number,
  homeTeamRank: number | undefined,
  awayTeamRank: number | undefined,
  // weatherData parameter removed
  matchEvents: any[],
  matchStatus: string
) => {
  const config = {
    weights: {
      homeAdvantage: 12,
      form: 1.5,
      h2h: 2.5,
      rankDifference: 0.8,
      goalDifference: 6,
      xGInfluence: 3,
      // weatherInfluence config removed
      matchActivity: 0.5,
      liveMatchBonus: 5,
    },
    h2hMaxGames: 5,
    drawWeight: 0.85,
  };

  let homeScore = 0;
  let awayScore = 0;

  // 1. Home Advantage
  homeScore += config.weights.homeAdvantage;

  // 2. Momentum (Recent Form)
  const calculateForm = (formString: string): number => {
    return (
      (formString.match(/W/g) || []).length * 3 +
      (formString.match(/D/g) || []).length * 1
    );
  };
  const homeFormString = homeTeamStats?.form || "";
  const awayFormString = awayTeamStats?.form || "";
  homeScore += calculateForm(homeFormString) * config.weights.form;
  awayScore += calculateForm(awayFormString) * config.weights.form;

  // 3. Goal Form (Average Goal Difference)
  const homeGoalsForAvg = homeTeamStats?.goals?.for?.average?.total ?? 0;
  const homeGoalsAgainstAvg =
    homeTeamStats?.goals?.against?.average?.total ?? 0;
  const awayGoalsForAvg = awayTeamStats?.goals?.for?.average?.total ?? 0;
  const awayGoalsAgainstAvg =
    awayTeamStats?.goals?.against?.average?.total ?? 0;

  const homeGoalDiff = homeGoalsForAvg - homeGoalsAgainstAvg;
  const awayGoalDiff = awayGoalsForAvg - awayGoalsAgainstAvg;
  homeScore += homeGoalDiff * config.weights.goalDifference;
  awayScore += awayGoalDiff * config.weights.goalDifference;

  // 4. Simulated Expected Goals (xG)
  const simulateXG = (avgGoals: number) => Math.min(avgGoals * 1.1, 3.0);
  const homeXG = simulateXG(homeGoalsForAvg);
  const awayXG = simulateXG(awayGoalsForAvg);

  const xgDiff = homeXG - awayXG;
  homeScore += xgDiff * config.weights.xGInfluence;
  awayScore -= xgDiff * config.weights.xGInfluence;

  // 5. Head-to-Head (H2H) Records
  if (h2h && h2h.length > 0) {
    h2h.slice(0, config.h2hMaxGames).forEach((match) => {
      if (match.teams.home.winner) {
        homeTeamId === match.teams.home.id
          ? (homeScore += config.weights.h2h)
          : (awayScore += config.weights.h2h);
      } else if (match.teams.away.winner) {
        homeTeamId === match.teams.away.id
          ? (homeScore += config.weights.h2h)
          : (awayScore += config.weights.h2h);
      } else {
        // It was a draw
        homeScore += config.weights.h2h / 2;
        awayScore += config.weights.h2h / 2;
      }
    });
  }

  // 6. League Rank Difference
  if (homeTeamRank != null && awayTeamRank != null) {
    const rankDiff = Math.abs(homeTeamRank - awayTeamRank);
    if (homeTeamRank < awayTeamRank) {
      homeScore += rankDiff * config.weights.rankDifference;
    } else if (awayTeamRank < homeTeamRank) {
      awayScore += rankDiff * config.weights.rankDifference;
    }
  }

  // 7. Weather Conditions (Logic removed)
  // The weather influence logic is entirely removed.

  // 8. Match Activity Analysis
  const isLiveMatch = ["1H", "HT", "2H", "ET", "BT", "P", "LIVE"].includes(
    matchStatus
  );
  if (isLiveMatch) {
    homeScore += config.weights.liveMatchBonus;
    awayScore += config.weights.liveMatchBonus;
    const recentEventsCount = matchEvents.filter(
      (event: any) =>
        (event.type === "Goal" || event.type === "Card") &&
        event.time.elapsed > (matchStatus === "1H" ? 1 : 45)
    ).length;
    homeScore += recentEventsCount * config.weights.matchActivity;
    awayScore += recentEventsCount * config.weights.matchActivity;
  }

  // --- Final Calculation & Normalization ---
  homeScore = Math.max(1, homeScore);
  awayScore = Math.max(1, awayScore);
  const drawScore =
    (homeScore + awayScore) *
    (1 - Math.abs(homeScore - awayScore) / (homeScore + awayScore)) *
    config.drawWeight;
  const totalPoints = homeScore + awayScore + drawScore;

  if (totalPoints <= 1) {
    return { home: 33, draw: 34, away: 33 };
  }

  let homePercent = Math.round((homeScore / totalPoints) * 100);
  let awayPercent = Math.round((awayScore / totalPoints) * 100);
  let drawPercent = 100 - homePercent - awayPercent;

  if (homePercent + awayPercent + drawPercent !== 100) {
    const diff = 100 - (homePercent + awayPercent + drawPercent);
    if (homePercent >= awayPercent && homePercent >= drawPercent) {
      homePercent += diff;
    } else if (awayPercent >= homePercent && awayPercent >= drawPercent) {
      awayPercent += diff;
    } else {
      drawPercent += diff;
    }
  }

  return {
    home: homePercent,
    draw: drawPercent,
    away: awayPercent,
  };
};

// --- Helper to convert percentages to decimal odds (Unchanged) ---
const convertPercentageToOdds = (percent: number): string => {
  if (percent <= 0) return "INF";
  return (100 / percent).toFixed(2);
};

// --- The main data fetching function ---
const fetchAllDataForFixture = async (fixtureId: string | number) => {
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
  // venueLat and venueLon extraction removed

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
    axios.request(options("odds", { fixture: fixtureId, bet: "1" })),
    axios.request(
      options("standings", { league: league.id, season: league.season })
    ),
    // Weather API request removed
  ]);

  const standings =
    standingsResponse.data.response[0]?.league?.standings[0] || [];
  const homeTeamRank = standings.find(
    (s: any) => s.team.id === homeTeam.id
  )?.rank;
  const awayTeamRank = standings.find(
    (s: any) => s.team.id === awayTeam.id
  )?.rank;

  console.log(fixtureData);

  const customPredictionPercentages = calculateCustomPrediction(
    h2hResponse.data.response,
    homeStatsResponse.data.response,
    awayStatsResponse.data.response,
    homeTeam.id,
    homeTeamRank,
    awayTeamRank,
    // null, // weatherData parameter removed
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

// --- The GET handler that the frontend calls ---
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const fixtureId = searchParams.get("fixture");

  if (!fixtureId) {
    return NextResponse.json(
      { error: "Fixture ID is required" },
      { status: 400 }
    );
  }

  try {
    const matchDetails = await fetchAllDataForFixture(fixtureId);
    return NextResponse.json(matchDetails);
  } catch (error: any) {
    console.error(
      `[API /match-details] Error for fixture ${fixtureId}:`,
      error.message
    );
    return NextResponse.json(
      { error: "Failed to fetch match details." },
      { status: 500 }
    );
  }
}
