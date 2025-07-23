// ===== src/lib/data/team.ts (Redis Enhanced) =====

import axios from 'axios';
import redis from '@/lib/redis'; // <-- 1. Import Redis client

const CACHE_TTL_SECONDS = 60 * 60 * 12; // Cache team data for 12 hours

export async function fetchTeamDetails(teamId: string) {
    const season = new Date().getFullYear().toString();
    
    // 2. Create a unique cache key for this team and season
    const cacheKey = `team-details:${teamId}:${season}`;

    try {
        // 3. Check Redis first
        const cachedData = await redis.get(cacheKey);
        if (cachedData) {
            console.log(`[Cache HIT] Returning cached data for key: ${cacheKey}`);
            return JSON.parse(cachedData);
        }

        // 4. Cache Miss: Fetch fresh data from the external API
        console.log(`[Cache MISS] Fetching fresh data for key: ${cacheKey}`);
        
        const options = (endpoint: string, params: object) => ({
            method: 'GET',
            url: `${process.env.NEXT_PUBLIC_API_FOOTBALL_HOST}/${endpoint}`,
            params,
            headers: { 'x-apisports-key': process.env.NEXT_PUBLIC_API_FOOTBALL_KEY },
        });

        const [
            teamInfoResponse,
            squadResponse,
            recentFixturesResponse,
            standingsResponse
        ] = await Promise.all([
            axios.request(options('teams', { id: teamId })),
            axios.request(options('players/squads', { team: teamId })),
            axios.request(options('fixtures', { team: teamId, last: 10 })),
            axios.request(options('standings', { team: teamId, season: season })),
        ]);

        if (!teamInfoResponse.data.response || teamInfoResponse.data.response.length === 0) {
            console.warn(`[API/team] No team info found for ID: ${teamId}`);
            return null;
        }

        const responseData = {
            teamInfo: teamInfoResponse.data.response[0],
            squad: squadResponse.data.response[0]?.players ?? [],
            fixtures: recentFixturesResponse.data.response,
            standings: standingsResponse.data.response,
        };

        // 5. Store the combined fresh data in Redis
        await redis.set(cacheKey, JSON.stringify(responseData), "EX", CACHE_TTL_SECONDS);
        console.log(`[Cache SET] Stored fresh data for key: ${cacheKey}`);
        
        return responseData;

    } catch (error) {
        console.error(`[fetchTeamDetails] Error fetching details for team ${teamId}:`, error);
        return null;
    }
}