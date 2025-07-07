// src/lib/prediction-engine.ts
// This file contains the core logic for the simple prediction engine.

import type {
  ApiSportsFixture,
  ApiSportsStandings,
  CleanOdds,
} from "@/services/sportsApi/allsportsApiService"; // Assuming these types exist

// Define the interfaces used by the prediction engine.
// These are duplicated here for clarity in this file; ideally, they would be in a shared `types` directory.
export interface PredictionResult {
  prediction: "1" | "X" | "2";
  text: string;
  confidence: number;
  homeScore: number;
  awayScore: number;
  drawScore: number;
}

interface PredictionData {
  fixture: ApiSportsFixture;
  h2h: ApiSportsFixture[];
  standings: ApiSportsStandings[];
  homeTeamForm: ApiSportsFixture[];
  awayTeamForm: ApiSportsFixture[];
}

/**
 * Generates a simple match prediction based on recent form, standings, and Head-to-Head (H2H) records.
 *
 * @param {PredictionData} data - An object containing fixture details, H2H matches, league standings,
 *                                 and recent form for both home and away teams.
 * @returns {PredictionResult} The predicted outcome (Home Win, Draw, or Away Win) with confidence score.
 */
export function generateSimplePrediction({
  fixture,
  h2h,
  standings,
  homeTeamForm,
  awayTeamForm,
}: PredictionData): PredictionResult {
  let homeScore = 1.0; // Base score for home team
  let awayScore = 1.0; // Base score for away team
  let drawScore = 1.0; // Base score for a draw

  const homeTeamId = fixture.teams.home.id;
  const awayTeamId = fixture.teams.away.id;

  // Helper function to analyze a team's recent form
  const analyzeForm = (formFixtures: ApiSportsFixture[], teamId: number) => {
    let formPoints = 0;
    // Filter for finished games and consider only the last 5 relevant matches
    const finishedGames = formFixtures
      .filter((f) => f.fixture.status.short === "FT")
      .slice(0, 5);
    finishedGames.forEach((game) => {
      // Check if the team won (either as home or away)
      if (
        (game.teams.home.id === teamId && game.teams.home.winner) ||
        (game.teams.away.id === teamId && game.teams.away.winner)
      ) {
        formPoints += 0.8; // Reward for a win
      } else if (!game.teams.home.winner && !game.teams.away.winner) {
        // It was a draw (neither team won)
        formPoints += 0.3; // Smaller reward for a draw
      }
      // No points for a loss
    });
    return formPoints;
  };

  // Apply form analysis to home and away teams
  homeScore += analyzeForm(homeTeamForm, homeTeamId);
  awayScore += analyzeForm(awayTeamForm, awayTeamId);

  // Analyze League Standings
  const leagueStandings = standings[0]?.league?.standings[0]; // Assuming first standing is the main one
  if (leagueStandings && leagueStandings.length > 0) {
    const homeTeamData = leagueStandings.find(
      (t: any) => t.team.id === homeTeamId
    );
    const awayTeamData = leagueStandings.find(
      (t: any) => t.team.id === awayTeamId
    );

    if (homeTeamData && awayTeamData) {
      const rankDiff = Math.abs(homeTeamData.rank - awayTeamData.rank);
      // Reward higher-ranked team based on rank difference, scaled by league size
      if (homeTeamData.rank < awayTeamData.rank) {
        homeScore += (rankDiff / leagueStandings.length) * 3;
      } else if (awayTeamData.rank < homeTeamData.rank) {
        awayScore += (rankDiff / leagueStandings.length) * 3;
      }
      // Increase draw potential if teams are very close in rank
      if (rankDiff <= 3) {
        drawScore += (1 - rankDiff / 4) * 2; // Stronger draw bias if rank difference is small
      }
    }
  }

  // Analyze Head-to-Head (H2H) Records
  if (h2h && h2h.length > 0) {
    let h2hHomeWins = 0;
    let h2hAwayWins = 0;
    // Consider only the most recent 5 H2H matches
    h2h.slice(0, 5).forEach((match) => {
      // Check if home team of the current fixture won the H2H match
      if (
        (match.teams.home.id === homeTeamId && match.teams.home.winner) ||
        (match.teams.away.id === homeTeamId && match.teams.away.winner)
      ) {
        h2hHomeWins++;
      }
      // Check if away team of the current fixture won the H2H match
      if (
        (match.teams.home.id === awayTeamId && match.teams.home.winner) ||
        (match.teams.away.id === awayTeamId && match.teams.away.winner)
      ) {
        h2hAwayWins++;
      }
    });
    homeScore += h2hHomeWins * 0.4;
    awayScore += h2hAwayWins * 0.4;
  }

  // Calculate total score and normalize to percentages for confidence
  const totalScore = homeScore + awayScore + drawScore;

  if (homeScore > awayScore && homeScore > drawScore) {
    return {
      prediction: "1", // Home Win
      text: "Home Win",
      confidence: Math.round((homeScore / totalScore) * 100),
      homeScore,
      awayScore,
      drawScore,
    };
  } else if (awayScore > homeScore && awayScore > drawScore) {
    return {
      prediction: "2", // Away Win
      text: "Away Win",
      confidence: Math.round((awayScore / totalScore) * 100),
      homeScore,
      awayScore,
      drawScore,
    };
  } else {
    return {
      prediction: "X", // Draw
      text: "Draw",
      confidence: Math.round((drawScore / totalScore) * 100),
      homeScore,
      awayScore,
      drawScore,
    };
  }
}
