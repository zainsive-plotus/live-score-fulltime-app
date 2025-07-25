// src/app/api/global-live/route.ts
import { NextResponse } from 'next/server';
import axios from 'axios';

// This function handles GET requests to /api/global-live
export async function GET() {
  const options = {
    method: 'GET',
    url: `${process.env.NEXT_PUBLIC_API_FOOTBALL_HOST}/fixtures`,
    // The key is to use the `live: 'all'` parameter
    params: { live: 'all' },
    headers: {
      'x-apisports-key': process.env.NEXT_PUBLIC_API_FOOTBALL_KEY,
    },
  };

  try {
    const response = await axios.request(options);
    // Directly return the array of live fixtures
    return NextResponse.json(response.data.response);
  } catch (error) {
    console.error("Error fetching global live matches:", error);
    return NextResponse.json({ error: 'Failed to fetch live matches' }, { status: 500 });
  }
}