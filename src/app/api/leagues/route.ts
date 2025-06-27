import { NextResponse } from 'next/server';
import axios from 'axios';
import { League } from '@/types/api-football';
import { generateLeagueSlug } from '@/lib/generate-league-slug';

// --- DEFINE CURATED LISTS OF POPULAR COMPETITIONS ---
// This is a list of well-known league IDs used for the sidebar's default view.
const POPULAR_LEAGUE_IDS = new Set([
  39,  // England - Premier League
  140, // Spain - La Liga
  135, // Italy - Serie A
  78,  // Germany - Bundesliga
  61,  // France - Ligue 1
  88,  // Netherlands - Eredivisie
  94,  // Portugal - Primeira Liga
  253, // USA - MLS
  203, // Turkey - Süper Lig
]);

const POPULAR_CUP_IDS = new Set([
  2,   // UEFA Champions League
  3,   // UEFA Europa League
  531, // UEFA Conference League
  45,  // England - FA Cup
  9,   // Copa Libertadores
  11,  // Copa Sudamericana
]);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const country = searchParams.get('country');
  const type = searchParams.get('type'); // Can be 'league' or 'cup'
  const fetchAll = searchParams.get('fetchAll'); // <-- NEW PARAMETER

  const params: { current: string; country?: string, type?: string } = {
    current: 'true',
  };

  if (country) {
    params.country = country;
  }
  if (type) {
    params.type = type;
  }

  const options = {
    method: 'GET',
    url: `${process.env.NEXT_PUBLIC_API_FOOTBALL_HOST}/leagues`,
    params: params, 
    headers: {
      'x-apisports-key': process.env.NEXT_PUBLIC_API_FOOTBALL_KEY,
    },
  };

  try {
    const response = await axios.request(options);
    let allLeagues = response.data.response;

    // --- UPDATED FILTERING LOGIC ---
    // If we are on the global view (no country selected) AND we are NOT fetching for a directory page,
    // then filter the results to only show popular competitions.
    if (!country && !fetchAll) {
      const popularIds = type === 'cup' ? POPULAR_CUP_IDS : POPULAR_LEAGUE_IDS;
      allLeagues = allLeagues.filter((item: any) => popularIds.has(item.league.id));
    }
    
    // Perform data transformation for all cases
    const transformedData: League[] = allLeagues
      .filter((item: any) => item.league.id && item.league.name && item.league.logo)
      .map((item: any) => ({
        id: item.league.id,
        name: item.league.name,
        logoUrl: item.league.logo,
        countryName: item.country.name,
        countryFlagUrl: item.country.flag,
        type: item.league.type,    
        href: generateLeagueSlug(item.league.name, item.league.id),
      }));
    
    // Sort the results alphabetically for a consistent order
    transformedData.sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json(transformedData);

  } catch (error) {
    console.error("Error fetching leagues:", error);
    return NextResponse.json(
      { error: 'Failed to fetch league data.' },
      { status: 500 }
    );
  }
}