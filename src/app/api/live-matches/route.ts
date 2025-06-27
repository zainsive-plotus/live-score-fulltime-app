import { NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const leagueId = searchParams.get('league');

  if (!leagueId) {
    return NextResponse.json({ error: 'League ID is required' }, { status: 400 });
  }

  const options = {
    method: 'GET',
    url: `${process.env.NEXT_PUBLIC_API_FOOTBALL_HOST}/fixtures`,
    params: {
      league: leagueId,
      live: 'all',
    },
    headers: {
      'x-apisports-key': process.env.NEXT_PUBLIC_API_FOOTBALL_KEY,
    },
  };

  try {
    const response = await axios.request(options);
    // Directly return the response data, which is an array of live fixtures
    return NextResponse.json(response.data.response);
  } catch (error) {
    console.error("Error fetching live matches:", error);
    return NextResponse.json({ error: 'Failed to fetch live matches' }, { status: 500 });
  }
}