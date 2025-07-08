// src/lib/prediction-engine.ts

// --- HELPER: Factorial function (unchanged) ---
function factorial(n: number): number {
  if (n < 0) return -1;
  if (n === 0 || n === 1) return 1;
  let result = 1;
  for (let i = 2; i <= n; i++) {
    result *= i;
  }
  return result;
}

// --- HELPER: Poisson Distribution function (unchanged) ---
function poissonProbability(k: number, lambda: number): number {
  if (lambda < 0) return 0;
  return (Math.pow(lambda, k) * Math.exp(-lambda)) / factorial(k);
}

// --- HELPER: Odds to probability conversion (unchanged) ---
function convertOddsToNormalizedProbabilities(odds: {
  home: string;
  draw: string;
  away: string;
}): { home: number; draw: number; away: number } {
  const homeOdd = parseFloat(odds.home);
  const drawOdd = parseFloat(odds.draw);
  const awayOdd = parseFloat(odds.away);
  const impliedHome = 1 / homeOdd;
  const impliedDraw = 1 / drawOdd;
  const impliedAway = 1 / awayOdd;
  const totalImplied = impliedHome + impliedDraw + impliedAway;
  if (totalImplied === 0) return { home: 33.3, draw: 33.3, away: 33.3 };
  const normalizedHome = (impliedHome / totalImplied) * 100;
  const normalizedDraw = (impliedDraw / totalImplied) * 100;
  const normalizedAway = (impliedAway / totalImplied) * 100;
  return { home: normalizedHome, draw: normalizedDraw, away: normalizedAway };
}

// --- NEW HELPER: Find the top scorer from a squad list ---
function findTopScorer(squad: any[]): any | null {
  if (!squad || squad.length === 0) return null;
  // Sort players by goals descending to find the top scorer
  return squad.sort((a, b) => (b.goals?.total || 0) - (a.goals?.total || 0))[0];
}

// --- MAIN FUNCTION: Upgraded to be context-aware ---
export function generateHybridPrediction(
  homeTeamStats: any,
  awayTeamStats: any,
  bookmakerOdds: { home: string; draw: string; away: string } | null,
  homeLineup: any | null,
  awayLineup: any | null,
  homeSquad: any[] | null,
  awaySquad: any[] | null
): { home: number; draw: number; away: number } {
  // --- Step 1: Calculate Base Poisson Probabilities (Unchanged logic) ---
  const leagueGoals = homeTeamStats?.goals;
  if (!leagueGoals) {
    console.warn("Prediction Engine: Missing league goal stats. Falling back.");
    return { home: 34, draw: 33, away: 33 };
  }
  const avgLeagueGoalsHome = parseFloat(leagueGoals.for.average.home) || 1.4;
  const avgLeagueGoalsAway = parseFloat(leagueGoals.for.average.away) || 1.1;
  const homeAttackStrength =
    (parseFloat(homeTeamStats.goals.for.average.home) || avgLeagueGoalsHome) /
    avgLeagueGoalsHome;
  const homeDefenseStrength =
    (parseFloat(homeTeamStats.goals.against.average.home) ||
      avgLeagueGoalsAway) / avgLeagueGoalsAway;
  const awayAttackStrength =
    (parseFloat(awayTeamStats.goals.for.average.away) || avgLeagueGoalsAway) /
    avgLeagueGoalsAway;
  const awayDefenseStrength =
    (parseFloat(awayTeamStats.goals.against.average.away) ||
      avgLeagueGoalsHome) / avgLeagueGoalsHome;

  let lambdaHome =
    homeAttackStrength * awayDefenseStrength * avgLeagueGoalsHome;
  let lambdaAway =
    awayAttackStrength * homeDefenseStrength * avgLeagueGoalsAway;

  // --- NEW: Step 2: Adjust Expected Goals Based on Key Player Availability ---
  const KEY_PLAYER_ABSENCE_PENALTY = 0.82; // Apply an 18% penalty to expected goals.

  const homeTopScorer = findTopScorer(homeSquad);
  const awayTopScorer = findTopScorer(awaySquad);

  if (homeTopScorer && homeLineup?.startXI) {
    const isScorerStarting = homeLineup.startXI.some(
      (p: any) => p.player.id === homeTopScorer.id
    );
    if (!isScorerStarting) {
      lambdaHome *= KEY_PLAYER_ABSENCE_PENALTY;
      console.log(
        `Prediction Engine: Home top scorer (${homeTopScorer.name}) is NOT starting. Applying penalty.`
      );
    }
  }

  if (awayTopScorer && awayLineup?.startXI) {
    const isScorerStarting = awayLineup.startXI.some(
      (p: any) => p.player.id === awayTopScorer.id
    );
    if (!isScorerStarting) {
      lambdaAway *= KEY_PLAYER_ABSENCE_PENALTY;
      console.log(
        `Prediction Engine: Away top scorer (${awayTopScorer.name}) is NOT starting. Applying penalty.`
      );
    }
  }

  // --- Step 3: Calculate Probabilities with (potentially adjusted) lambdas ---
  let poissonHomeProb = 0,
    poissonDrawProb = 0,
    poissonAwayProb = 0;
  const maxGoals = 8;
  for (let i = 0; i <= maxGoals; i++) {
    for (let j = 0; j <= maxGoals; j++) {
      const scorelineProbability =
        poissonProbability(i, lambdaHome) * poissonProbability(j, lambdaAway);
      if (i > j) poissonHomeProb += scorelineProbability;
      else if (j > i) poissonAwayProb += scorelineProbability;
      else poissonDrawProb += scorelineProbability;
    }
  }
  const totalPoissonProb = poissonHomeProb + poissonDrawProb + poissonAwayProb;

  const poissonPercentages = {
    home:
      totalPoissonProb > 0 ? (poissonHomeProb / totalPoissonProb) * 100 : 34,
    draw:
      totalPoissonProb > 0 ? (poissonDrawProb / totalPoissonProb) * 100 : 33,
    away:
      totalPoissonProb > 0 ? (poissonAwayProb / totalPoissonProb) * 100 : 33,
  };

  // --- Step 4 & 5: Blend with Market and Finalize (Unchanged) ---
  if (!bookmakerOdds) {
    return {
      home: Math.round(poissonPercentages.home),
      draw: Math.round(poissonPercentages.draw),
      away: Math.round(poissonPercentages.away),
    };
  }
  const marketPercentages = convertOddsToNormalizedProbabilities(bookmakerOdds);
  const FANSKOR_MODEL_WEIGHT = 0.6;
  const MARKET_ODDS_WEIGHT = 0.4;
  const finalHome =
    poissonPercentages.home * FANSKOR_MODEL_WEIGHT +
    marketPercentages.home * MARKET_ODDS_WEIGHT;
  const finalDraw =
    poissonPercentages.draw * FANSKOR_MODEL_WEIGHT +
    marketPercentages.draw * MARKET_ODDS_WEIGHT;
  return {
    home: Math.round(finalHome),
    draw: Math.round(finalDraw),
    away: Math.round(100 - Math.round(finalHome) - Math.round(finalDraw)),
  };
}
