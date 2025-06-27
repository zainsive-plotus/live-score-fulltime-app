// src/app/api/upcoming-matches/route.ts
import { NextResponse } from 'next/server';
import axios from 'axios';
import { format, subDays, addDays } from 'date-fns';

// This is your existing API route for upcoming matches. Let's rename it
// to something more generic as it will now handle more than just "upcoming".
// The file path remains the same for backward compatibility.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const leagueId = searchParams.get('league');

  if (!leagueId) {
    // If no leagueId, this route should do nothing or return an error.
    // Your global fetching is handled by the /api/fixtures route.
    return NextResponse.json({ error: 'League ID is required' }, { status: 400 });
  }

  const season = new Date().getFullYear().toString();
  const today = format(new Date(), 'yyyy-MM-dd');
  const nextSevenDays = format(addDays(new Date(), 7), 'yyyy-MM-dd');

  const options = (params: object) => ({
    method: 'GET',
    url: `${process.env.NEXT_PUBLIC_API_FOOTBALL_HOST}/fixtures`,
    params,
    headers: { 'x-apisports-key': process.env.NEXT_PUBLIC_API_FOOTBALL_KEY },
  });

  try {
    // --- 1. First, try to fetch UPCOMING matches ---
    const upcomingResponse = await axios.request(options({
      league: leagueId,
      season: season,
      from: today,
      to: nextSevenDays,
    }));
    
    let matches = upcomingResponse.data.response;

    // --- 2. If NO upcoming matches are found, fetch RECENT finished matches ---
    if (matches.length === 0) {
      console.log(`No upcoming matches for league ${leagueId}. Fetching recent results...`);
      const finishedResponse = await axios.request(options({
        league: leagueId,
        season: season,
        last: 5, // Get the last 5 finished fixtures
        status: 'FT', // Only get matches with a status of "Finished"
      }));
      matches = finishedResponse.data.response;
    }
    
    return NextResponse.json(matches);

  } catch (error) {
    console.error(`Error fetching matches for league ${leagueId}:`, error);
    return NextResponse.json({ error: 'Failed to fetch match data' }, { status: 500 });
  }
}