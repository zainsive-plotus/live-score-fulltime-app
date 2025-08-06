import { cache } from "react";
import axios from "axios";
import "server-only";
import { calculateCustomPrediction } from "@/lib/prediction-engine";
import { getNews } from "@/lib/data/news";
import { getMatchHighlights as fetchHighlights } from "@/lib/data/highlightly";

// A single, reusable function for making API-Football requests
const apiRequest = async <T>(
  endpoint: string,
  params: object
): Promise<T | null> => {
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
    console.error(`[data/match.ts] API request failed for ${endpoint}:`, error);
    return null;
  }
};

// --- Granular, Cached Data Fetching Functions for Streaming ---

export const getFixture = cache(async (fixtureId: string) => {
  const fixtureResponse = await apiRequest<any>("fixtures", { id: fixtureId });
  if (!fixtureResponse || fixtureResponse.length === 0) return null;
  return fixtureResponse[0];
});

export const getStatistics = cache(async (fixtureId: string) => {
  return await apiRequest<any>("fixtures/statistics", { fixture: fixtureId });
});

export const getH2H = cache(async (homeTeamId: number, awayTeamId: number) => {
  return await apiRequest<any>("fixtures/headtohead", {
    h2h: `${homeTeamId}-${awayTeamId}`,
  });
});

export const getTeamStats = cache(
  async (leagueId: number, season: number, teamId: number) => {
    return await apiRequest<any>("teams/statistics", {
      league: leagueId,
      season: season,
      team: teamId,
    });
  }
);

export const getStandings = cache(async (leagueId: number, season: number) => {
  return await apiRequest<any>("standings", {
    league: leagueId,
    season: season,
  });
});

export const getBookmakerOdds = cache(async (fixtureId: string) => {
  const response = await apiRequest<any>("odds", {
    fixture: fixtureId,
    bet: "1",
  });
  return response ?? [];
});

export const getLinkedNews = cache(
  async (fixtureId: number, locale: string) => {
    const newsData = await getNews({
      linkedFixtureId: fixtureId,
      limit: 5,
      locale,
    });
    return newsData.posts;
  }
);

export const getMatchHighlights = cache(
  async (leagueName: string, homeTeamName: string, awayTeamName: string) => {
    const highlightsData = await fetchHighlights({
      leagueName,
      homeTeamName,
      awayTeamName,
      limit: 10,
    });
    return highlightsData?.data ?? [];
  }
);

// **THE FIX**: Re-introducing the getPredictionData function
export const getPredictionData = cache(
  async (
    fixtureId: string,
    homeTeamId: number,
    awayTeamId: number,
    leagueId: number,
    season: number
  ) => {
    const [h2h, homeTeamStats, awayTeamStats, standingsResponse] =
      await Promise.all([
        getH2H(homeTeamId, awayTeamId),
        getTeamStats(leagueId, season, homeTeamId),
        getTeamStats(leagueId, season, awayTeamId),
        getStandings(leagueId, season),
      ]);

    const flatStandings =
      standingsResponse?.[0]?.league?.standings?.flat() || [];
    const homeTeamRank = flatStandings.find(
      (s: any) => s.team.id === homeTeamId
    )?.rank;
    const awayTeamRank = flatStandings.find(
      (s: any) => s.team.id === awayTeamId
    )?.rank;

    // We pass null for events as this is for pre-match prediction
    const customPrediction = calculateCustomPrediction(
      h2h,
      homeTeamStats,
      awayTeamStats,
      homeTeamId,
      homeTeamRank,
      awayTeamRank,
      null,
      "NS"
    );

    return {
      homeTeamStats,
      awayTeamStats,
      customPrediction,
    };
  }
);

// DEPRECATED: This function is replaced by the granular functions above.
export const fetchMatchPageData = cache(async (fixtureId: string) => {
  console.warn(
    "DEPRECATED: fetchMatchPageData is called. Please refactor to use granular data hooks."
  );
  const fixtureData = await getFixture(fixtureId);
  if (!fixtureData) return null;
  const { league, teams } = fixtureData;
  const { home: homeTeam, away: awayTeam } = teams;
  const [
    statistics,
    h2h,
    homeTeamStats,
    awayTeamStats,
    standingsResponse,
    bookmakerOdds,
  ] = await Promise.all([
    getStatistics(fixtureId),
    getH2H(homeTeam.id, awayTeam.id),
    getTeamStats(league.id, league.season, homeTeam.id),
    getTeamStats(league.id, league.season, awayTeam.id),
    getStandings(league.id, league.season),
    getBookmakerOdds(fixtureId),
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
    fixtureData.fixture.status.short
  );
  return {
    fixture: fixtureData,
    statistics,
    h2h,
    standings: standingsResponse,
    analytics: {
      homeTeamStats,
      awayTeamStats,
      customPrediction,
      bookmakerOdds,
    },
  };
});
