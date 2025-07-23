// ===== src/app/api/directory/teams/route.ts (Redis Enhanced) =====

import { NextResponse } from 'next/server';
import axios from 'axios';
import redis from '@/lib/redis'; // <-- 1. Import our Redis client

const POPULAR_LEAGUE_IDS = [
  39, 140, 135, 78, 61, 88, 94, 253, 2,
];
const season = new Date().getFullYear();
const CACHE_KEY = `teams:popular:${season}`;
const CACHE_TTL_SECONDS = 60 * 60 * 24; // Cache for 24 hours

export async function GET() {
  try {
    // 2. Check Redis for cached data first
    const cachedData = await redis.get(CACHE_KEY);
    if (cachedData) {
      console.log(`[Cache HIT] Returning cached data for key: ${CACHE_KEY}`);
      return NextResponse.json(JSON.parse(cachedData));
    }

    // 3. Cache Miss: Fetch fresh data from the external API
    console.log(`[Cache MISS] Fetching fresh data for key: ${CACHE_KEY}`);
    
    const options = (leagueId: number) => ({
      method: 'GET',
      url: `${process.env.NEXT_PUBLIC_API_FOOTBALL_HOST}/teams`,
      params: { league: leagueId, season: season },
      headers: { 'x-apisports-key': process.env.NEXT_PUBLIC_API_FOOTBALL_KEY },
    });

    const teamPromises = POPULAR_LEAGUE_IDS.map(id => axios.request(options(id)));
    const responses = await Promise.allSettled(teamPromises);

    const allTeamsResponses = responses
      .filter(result => result.status === 'fulfilled' && result.value.data.response)
      .flatMap(result => (result as PromiseFulfilledResult<any>).value.data.response);

    // Using a Map ensures we only have unique teams, even if they play in multiple popular leagues
    const uniqueTeams = Array.from(new Map(allTeamsResponses.map(item => [item.team.id, item])).values());

    uniqueTeams.sort((a, b) => a.team.name.localeCompare(b.team.name));

    // 4. Store the newly fetched data in Redis with an expiration
    if (uniqueTeams.length > 0) {
      await redis.set(CACHE_KEY, JSON.stringify(uniqueTeams), "EX", CACHE_TTL_SECONDS);
      console.log(`[Cache SET] Stored fresh data for key: ${CACHE_KEY}`);
    }

    // 5. Return the fresh data
    return NextResponse.json(uniqueTeams);

  } catch (error) {
    console.error('[API/directory/teams] Error fetching teams data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch teams data.' },
      { status: 500 }
    );
  }
}