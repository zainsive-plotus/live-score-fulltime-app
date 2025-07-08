// src/lib/prediction-engine.ts

/**
 * FINAL OFFICIAL PREDICTION ENGINE V3.1
 * Based on the weighted model, now with live match momentum analysis.
 *
 * @param {object} data - An object containing all necessary data points.
 * @returns {object} An object with home, draw, and away win percentages.
 */
export function generatePrediction(
  h2h: any[],
  homeTeamStats: any,
  awayTeamStats: any,
  homeTeamId: number,
  homeTeamRank: number | undefined,
  awayTeamRank: number | undefined,
  matchEvents: any[] | null, // This is now crucial for live analysis
  matchStatus: string
): { home: number; draw: number; away: number } {
  // Configuration for weights
  const config = {
    weights: {
      homeAdvantage: 12,
      form: 1.5,
      h2h: 2.5,
      rankDifference: 0.8,
      goalDifference: 6.0,
      // --- NEW: Weights for live events ---
      liveGoalMomentum: 15, // A huge boost for the scoring team
      liveRedCardPenalty: -20, // A massive penalty for the team receiving a red card
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
    if (!formString) return 0;
    return (
      (formString.match(/W/g) || []).length * 3 +
      (formString.match(/D/g) || []).length * 1
    );
  };
  homeScore += calculateForm(homeTeamStats?.form || "") * config.weights.form;
  awayScore += calculateForm(awayTeamStats?.form || "") * config.weights.form;

  // 3. Goal Form (Average Goal Difference)
  const homeGoalDiff =
    (homeTeamStats?.goals?.for?.average?.total ?? 0) -
    (homeTeamStats?.goals?.against?.average?.total ?? 0);
  const awayGoalDiff =
    (awayTeamStats?.goals?.for?.average?.total ?? 0) -
    (awayTeamStats?.goals?.against?.average?.total ?? 0);
  homeScore += homeGoalDiff * config.weights.goalDifference;
  awayScore += awayGoalDiff * config.weights.goalDifference;

  // 4. Head-to-Head (H2H) Records
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
        homeScore += config.weights.h2h / 2;
        awayScore += config.weights.h2h / 2;
      }
    });
  }

  // 5. League Rank Difference
  if (homeTeamRank != null && awayTeamRank != null) {
    const rankDiff = Math.abs(homeTeamRank - awayTeamRank);
    if (homeTeamRank < awayTeamRank) {
      homeScore += rankDiff * config.weights.rankDifference;
    } else if (awayTeamRank < homeTeamRank) {
      awayScore += rankDiff * config.weights.rankDifference;
    }
  }

  // --- NEW: 6. Live Match Analysis ---
  if (
    ["1H", "HT", "2H", "ET", "BT", "P", "LIVE"].includes(matchStatus) &&
    matchEvents
  ) {
    console.log(
      `[Prediction Engine] Applying live analysis for match status: ${matchStatus}`
    );
    matchEvents.forEach((event) => {
      // Goal Momentum
      if (event.type === "Goal") {
        if (event.team.id === homeTeamId) {
          homeScore += config.weights.liveGoalMomentum;
        } else {
          awayScore += config.weights.liveGoalMomentum;
        }
      }
      // Red Card Penalty
      if (event.type === "Card" && event.detail === "Red Card") {
        if (event.team.id === homeTeamId) {
          homeScore += config.weights.liveRedCardPenalty;
        } else {
          awayScore += config.weights.liveRedCardPenalty;
        }
      }
    });
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
    if (homePercent >= awayPercent && homePercent >= drawPercent)
      homePercent += diff;
    else if (awayPercent >= homePercent && awayPercent >= drawPercent)
      awayPercent += diff;
    else drawPercent += diff;
  }

  return { home: homePercent, draw: drawPercent, away: awayPercent };
}
