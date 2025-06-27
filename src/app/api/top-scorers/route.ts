// src/app/api/top-scorers/route.ts

import { NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const leagueId = searchParams.get('league');
  const season = searchParams.get('season');

  if (!leagueId || !season) {
    return NextResponse.json(
      { error: 'League ID and season are required' },
      { status: 400 }
    );
  }

  const options = {
    method: 'GET',
    url: `${process.env.NEXT_PUBLIC_API_FOOTBALL_HOST}/players/topscorers`,
    params: {
      league: leagueId,
      season: season,
    },
    headers: {
      'x-apisports-key': process.env.NEXT_PUBLIC_API_FOOTBALL_KEY,
    },
  };

  try {
    const response = await axios.request(options);
    
    // The API returns an array of players with their stats. We can pass it directly.
    return NextResponse.json(response.data.response);

  } catch (error) {
    console.error("Error fetching top scorers:", error);
    return NextResponse.json(
      { error: 'Failed to fetch top scorers data.' },
      { status: 500 }
    );
  }
}