// src/app/api/teams/route.ts
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
    url: `${process.env.NEXT_PUBLIC_API_FOOTBALL_HOST}/teams`,
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
    
    // The response is an array of objects, each containing a `team` and `venue` object.
    // We can pass it directly to the frontend.
    return NextResponse.json(response.data.response);

  } catch (error) {
    console.error("Error fetching teams:", error);
    return NextResponse.json(
      { error: 'Failed to fetch teams data.' },
      { status: 500 }
    );
  }
}