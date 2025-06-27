// src/app/api/match-details/route.ts

import { NextResponse } from 'next/server';
import axios from 'axios';

// This is the only fetcher we need now. It's the original, efficient one.
const fetchAllDataForFixture = async (fixtureId: string | number) => {
    const options = (endpoint: string, params: object) => ({
      method: 'GET',
      url: `${process.env.NEXT_PUBLIC_API_FOOTBALL_HOST}/${endpoint}`,
      params,
      headers: { 'x-apisports-key': process.env.NEXT_PUBLIC_API_FOOTBALL_KEY },
    });
  
    const fixtureResponse = await axios.request(options('fixtures', { id: fixtureId }));
    const fixtureData = fixtureResponse.data.response[0];
    
    if (!fixtureData) {
        throw new Error(`Fixture not found with ID: ${fixtureId}`);
    }

    const { league, teams } = fixtureData;
    const { home: homeTeam, away: awayTeam } = teams;
  
    const [eventsResponse, statsResponse, h2hResponse, predictionResponse, homeStatsResponse, awayStatsResponse] = await Promise.all([
      axios.request(options('fixtures/events', { fixture: fixtureId })),
      axios.request(options('fixtures/statistics', { fixture: fixtureId })),
      axios.request(options('fixtures/headtohead', { h2h: `${homeTeam.id}-${awayTeam.id}` })),
      axios.request(options('predictions', { fixture: fixtureId })),
      axios.request(options('teams/statistics', { league: league.id, season: league.season, team: homeTeam.id })),
      axios.request(options('teams/statistics', { league: league.id, season: league.season, team: awayTeam.id })),
    ]);
  
    return {
      fixture: fixtureData,
      events: eventsResponse.data.response,
      statistics: statsResponse.data.response,
      h2h: h2hResponse.data.response,
      analytics: {
        prediction: predictionResponse.data.response[0] ?? null,
        homeTeamStats: homeStatsResponse.data.response ?? null,
        awayTeamStats: awayStatsResponse.data.response ?? null,
      }
    };
};


export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  // The API now ONLY cares about the fixture ID.
  const fixtureId = searchParams.get('fixture');

  if (!fixtureId) {
    return NextResponse.json({ error: 'Fixture ID is required' }, { status: 400 });
  }

  try {
    const matchDetails = await fetchAllDataForFixture(fixtureId);
    return NextResponse.json(matchDetails);
  } catch (error: any) {
    console.error(`[API /match-details] Error for fixture ${fixtureId}:`, error.message);
    return NextResponse.json({ error: 'Failed to fetch match details.' }, { status: 500 });
  }
}