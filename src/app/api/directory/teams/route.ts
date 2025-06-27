import { NextResponse } from 'next/server';
import axios from 'axios';

// A curated list of popular league IDs to source teams from.
const POPULAR_LEAGUE_IDS = [
  39,  // England - Premier League
  140, // Spain - La Liga
  135, // Italy - Serie A
  78,  // Germany - Bundesliga
  61,  // France - Ligue 1
  88,  // Netherlands - Eredivisie
  94,  // Portugal - Primeira Liga
  253, // USA - MLS
  2,   // UEFA Champions League
];

const season = new Date().getFullYear();

// This function handles GET requests to /api/directory/teams
export async function GET() {
  const options = (leagueId: number) => ({
    method: 'GET',
    url: `${process.env.NEXT_PUBLIC_API_FOOTBALL_HOST}/teams`,
    params: { league: leagueId, season: season },
    headers: { 'x-apisports-key': process.env.NEXT_PUBLIC_API_FOOTBALL_KEY },
  });

  try {
    // 1. Fetch all teams from all popular leagues in parallel
    const teamPromises = POPULAR_LEAGUE_IDS.map(id => axios.request(options(id)));
    const responses = await Promise.allSettled(teamPromises);

    // 2. Aggregate all teams and filter out any failed requests
    const allTeamsResponses = responses
      .filter(result => result.status === 'fulfilled')
      .flatMap(result => (result as PromiseFulfilledResult<any>).value.data.response);

    // 3. De-duplicate the teams using a Map (a team can be in a league and a cup)
    const uniqueTeams = Array.from(new Map(allTeamsResponses.map(item => [item.team.id, item])).values());

    // 4. Sort the final list alphabetically for a better user experience
    uniqueTeams.sort((a, b) => a.team.name.localeCompare(b.team.name));
    
    return NextResponse.json(uniqueTeams);

  } catch (error) {
    console.error("Error fetching teams for directory:", error);
    return NextResponse.json(
      { error: 'Failed to fetch teams data.' },
      { status: 500 }
    );
  }
}