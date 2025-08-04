// ===== src/lib/prediction-engine.ts =====

"use server-only"; // This logic should only run on the server

// ***** FIX: Added 'export' keyword *****
export const calculateCustomPrediction = (
  h2h: any[],
  homeTeamStats: any,
  awayTeamStats: any,
  homeTeamId: number,
  homeTeamRank: number | undefined,
  awayTeamRank: number | undefined,
  matchEvents: any[] | null,
  matchStatus: string
): { home: number; draw: number; away: number } => {
  const config = {
    weights: {
      homeAdvantage: 12,
      form: 1.5,
      h2h: 2.5,
      rankDifference: 0.8,
      goalDifference: 6.0,
      liveGoalMomentum: 15,
      liveRedCardPenalty: -20,
    },
    h2hMaxGames: 5,
    drawWeight: 0.85,
  };

  let homeScore = 0;
  let awayScore = 0;

  homeScore += config.weights.homeAdvantage;

  const calculateForm = (formString: string): number => {
    if (!formString) return 0;
    return (
      (formString.match(/W/g) || []).length * 3 +
      (formString.match(/D/g) || []).length * 1
    );
  };
  homeScore += calculateForm(homeTeamStats?.form || "") * config.weights.form;
  awayScore += calculateForm(awayTeamStats?.form || "") * config.weights.form;

  const homeGoalDiff =
    (homeTeamStats?.goals?.for?.average?.total ?? 0) -
    (homeTeamStats?.goals?.against?.average?.total ?? 0);
  const awayGoalDiff =
    (awayTeamStats?.goals?.for?.average?.total ?? 0) -
    (awayTeamStats?.goals?.against?.average?.total ?? 0);
  homeScore += homeGoalDiff * config.weights.goalDifference;
  awayScore += awayGoalDiff * config.weights.goalDifference;

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

  if (homeTeamRank != null && awayTeamRank != null) {
    const rankDiff = Math.abs(homeTeamRank - awayTeamRank);
    if (homeTeamRank < awayTeamRank) {
      homeScore += rankDiff * config.weights.rankDifference;
    } else if (awayTeamRank < homeTeamRank) {
      awayScore += rankDiff * config.weights.rankDifference;
    }
  }

  if (
    ["1H", "HT", "2H", "ET", "BT", "P", "LIVE"].includes(matchStatus) &&
    matchEvents
  ) {
    matchEvents.forEach((event) => {
      if (event.type === "Goal") {
        if (event.team.id === homeTeamId)
          homeScore += config.weights.liveGoalMomentum;
        else awayScore += config.weights.liveGoalMomentum;
      }
      if (event.type === "Card" && event.detail === "Red Card") {
        if (event.team.id === homeTeamId)
          homeScore += config.weights.liveRedCardPenalty;
        else awayScore += config.weights.liveRedCardPenalty;
      }
    });
  }

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
};

// ***** FIX: Added 'export' keyword *****
export const convertPercentageToOdds = (
  percent: number | undefined | null
): string => {
  if (percent === null || percent === undefined || percent <= 0) {
    return "N/A";
  }
  const safePercent = Math.max(1, Math.min(percent, 99));
  return (100 / safePercent).toFixed(2);
};
