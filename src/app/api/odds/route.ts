import { NextResponse } from 'next/server';
import axios from 'axios';

/**
 * API route to fetch pre-match odds for a specific fixture.
 * It is optimized to only request the "Match Winner" bet from a single, major bookmaker
 * to ensure a fast response and minimal data transfer.
 */
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const fixtureId = searchParams.get('fixture');

    // 1. Validate input: Ensure a fixture ID was provided.
    if (!fixtureId) {
        return NextResponse.json({ error: 'Fixture ID is required' }, { status: 400 });
    }

    // 2. Configure the optimized request to the external API.
    const options = {
        method: 'GET',
        url: `${process.env.NEXT_PUBLIC_API_FOOTBALL_HOST}/odds`,
        params: { 
            fixture: fixtureId, 
            bookmaker: '8', // A major, commonly available bookmaker (e.g., Bet365)
            bet: '1'        // The ID for the "Match Winner" bet (1X2)
        },
        headers: { 'x-apisports-key': process.env.NEXT_PUBLIC_API_FOOTBALL_KEY },
    };

    try {
        // 3. Make the external API call.
        const response = await axios.request(options);
        
        // 4. Handle the "No Data" case gracefully.
        // If the external API has no odds, it's not an error. We successfully found that there's no data.
        // We return a 200 OK status with a null body to signal this to the frontend.
        if (!response.data.response || response.data.response.length === 0) {
            console.log(`No odds found for fixture ${fixtureId}. Returning null.`);
            return NextResponse.json(null, { status: 200 }); 
        }
        
        const bookmaker = response.data.response[0].bookmakers[0];
        
        const matchWinnerBet = bookmaker.bets.find((bet: any) => bet.id === 1);

        // Also handle the case where the bookmaker doesn't offer this specific bet type.
        if (!matchWinnerBet || !matchWinnerBet.values) {
            console.log(`"Match Winner" odds not available for fixture ${fixtureId}. Returning null.`);
            return NextResponse.json(null, { status: 200 });
        }

        // 5. Transform the data into a clean, simple object for the frontend.
        // The API returns an array, but the frontend just needs a { home, draw, away } object.
        const odds = matchWinnerBet.values.reduce((acc: any, curr: any) => {
            if (curr.value === 'Home') acc.home = curr.odd;
            if (curr.value === 'Draw') acc.draw = curr.odd;
            if (curr.value === 'Away') acc.away = curr.odd;
            return acc;
        }, {});
        
        // 6. Return the successfully transformed odds.
        return NextResponse.json(odds, { status: 200 });

    } catch (error) {
        // 7. Handle actual server or network errors.
        console.error(`[API/ODDS] Error fetching odds for fixture ${fixtureId}:`, error);
        return NextResponse.json(
            { error: 'Failed to fetch odds data from the provider.' }, 
            { status: 500 }
        );
    }
}