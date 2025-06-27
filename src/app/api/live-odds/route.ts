import { NextResponse } from 'next/server';
import axios from 'axios';

/**
 * API route to fetch LIVE odds for all currently live matches.
 * This is a bulk fetch operation. It returns a map-like object
 * where keys are fixture IDs and values are the odds for that match.
 * This is far more efficient than fetching odds for each live match individually.
 */
export async function GET() {
    // Configure the request to the external API.
    // We are optimizing by only asking for the "Match Winner" bet type (id: 1).
    const options = {
        method: 'GET',
        url: `${process.env.NEXT_PUBLIC_API_FOOTBALL_HOST}/odds/live`,
        params: { bet: '1' }, 
        headers: { 'x-apisports-key': process.env.NEXT_PUBLIC_API_FOOTBALL_KEY },
    };

    try {
        const response = await axios.request(options);

        // If the external API returns no live odds, we successfully found that out.
        // Return a 200 OK status with an empty object.
        if (!response.data.response || response.data.response.length === 0) {
            return NextResponse.json({}, { status: 200 });
        }

        // Transform the array response into a more efficient key-value object (a map).
        // This allows our frontend to look up odds by fixture ID in O(1) time.
        // The final object will look like: { "12345": { home: "1.50", ... }, "67890": { ... } }
        const liveOddsObject = response.data.response.reduce((acc: any, fixtureData: any) => {
            const fixtureId = fixtureData.fixture.id;
            const bookmaker = fixtureData.bookmakers?.[0]; // Get the first available bookmaker
            const matchWinnerBet = bookmaker?.bets.find((bet: any) => bet.id === 1);

            // Ensure we found a valid "Match Winner" bet
            if (matchWinnerBet) {
                const odds = matchWinnerBet.values.reduce((oddAcc: any, curr: any) => {
                    if (curr.value === 'Home') oddAcc.home = curr.odd;
                    if (curr.value === 'Draw') oddAcc.draw = curr.odd;
                    if (curr.value === 'Away') oddAcc.away = curr.odd;
                    return oddAcc;
                }, {});
                acc[fixtureId] = odds;
            }
            return acc;
        }, {});

        // Return the successfully transformed odds object.
        return NextResponse.json(liveOddsObject, { status: 200 });

    } catch (error) {
        console.error('[API/LIVE-ODDS] Error fetching live odds:', error);
        return NextResponse.json(
            { error: 'Failed to fetch live odds data from the provider.' },
            { status: 500 }
        );
    }
}