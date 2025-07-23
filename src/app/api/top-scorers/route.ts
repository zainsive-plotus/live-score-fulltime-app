// ===== src/app/api/top-scorers/route.ts (Redis Enhanced) =====

import { NextResponse } from 'next/server';
import axios from 'axios';
import redis from '@/lib/redis'; // <-- 1. Import Redis client

const CACHE_TTL_SECONDS = 60 * 60 * 6; // Cache top scorers for 6 hours

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

  // 2. Create a unique cache key
  const cacheKey = `top-scorers:${leagueId}:${season}`;

  try {
    // 3. Check Redis first
    const cachedData = await redis.get(cacheKey);
    if (cachedData) {
      console.log(`[Cache HIT] Returning cached data for key: ${cacheKey}`);
      return NextResponse.json(JSON.parse(cachedData));
    }

    // 4. Cache Miss: Fetch fresh data
    console.log(`[Cache MISS] Fetching fresh data for key: ${cacheKey}`);
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
    
    const response = await axios.request(options);
    const topScorers = response.data.response;

    // 5. Store the fresh data in Redis
    if (topScorers && topScorers.length > 0) {
        await redis.set(cacheKey, JSON.stringify(topScorers), "EX", CACHE_TTL_SECONDS);
        console.log(`[Cache SET] Stored fresh data for key: ${cacheKey}`);
    }

    return NextResponse.json(topScorers);

  } catch (error) {
    console.error(`[API/top-scorers] Error for league ${leagueId}:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch top scorers data.' },
      { status: 500 }
    );
  }
}