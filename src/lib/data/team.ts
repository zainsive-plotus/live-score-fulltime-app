// src/lib/data/team.ts
import axios from 'axios';

// This function contains the core logic that was previously inside your API route.
// It can be called from ANY server-side code (Server Components, API Routes, etc.).
export async function fetchTeamDetails(teamId: string) {
    const season = new Date().getFullYear().toString();

    const options = (endpoint: string, params: object) => ({
        method: 'GET',
        url: `${process.env.NEXT_PUBLIC_API_FOOTBALL_HOST}/${endpoint}`,
        params,
        headers: { 'x-apisports-key': process.env.NEXT_PUBLIC_API_FOOTBALL_KEY },
    });

    try {
        // Fetch all data in parallel for maximum efficiency
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

        // Check if the primary team info fetch failed
        if (!teamInfoResponse.data.response || teamInfoResponse.data.response.length === 0) {
            // Returning null is better than throwing an error here,
            // as the calling page can handle it gracefully with notFound().
            return null; 
        }

        const responseData = {
            teamInfo: teamInfoResponse.data.response[0],
            squad: squadResponse.data.response[0]?.players ?? [],
            fixtures: recentFixturesResponse.data.response,
            standings: standingsResponse.data.response,
        };

        return responseData;

    } catch (error) {
        console.error(`[ServerLib] Error fetching details for team ${teamId}:`, error);
        // It's crucial to return null so the page can handle the error.
        return null; 
    }
}