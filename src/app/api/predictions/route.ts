import { NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const fixtureId = searchParams.get('fixture');

  if (!fixtureId) {
    return NextResponse.json({ error: 'Fixture ID is required' }, { status: 400 });
  }

  const options = {
    method: 'GET',
    url: `${process.env.NEXT_PUBLIC_API_FOOTBALL_HOST}/predictions`,
    params: { fixture: fixtureId },
    headers: {
      'x-apisports-key': process.env.NEXT_PUBLIC_API_FOOTBALL_KEY,
    },
  };

  try {
    const response = await axios.request(options);
    if (!response.data.response || response.data.response.length === 0) {
      return NextResponse.json({ error: 'No prediction available.' }, { status: 404 });
    }

    const predictionData = response.data.response[0];

    // --- THE FIX ---
    // We now extract and return the entire `teams` object from the prediction,
    // along with the percentages.
    const transformedPrediction = {
      teams: {
        home: {
          id: predictionData.teams.home.id,
          name: predictionData.teams.home.name,
          logo: predictionData.teams.home.logo, // <-- Pass the logo URL
        },
        away: {
          id: predictionData.teams.away.id,
          name: predictionData.teams.away.name,
          logo: predictionData.teams.away.logo, // <-- Pass the logo URL
        }
      },
      percent: {
        home: parseInt(predictionData.predictions.percent.home.replace('%', '')),
        draw: parseInt(predictionData.predictions.percent.draw.replace('%', '')),
        away: parseInt(predictionData.predictions.percent.away.replace('%', '')),
      }
    };

    return NextResponse.json(transformedPrediction);

  } catch (error) {
    console.error("Error fetching prediction:", error);
    return NextResponse.json({ error: 'Failed to fetch prediction data.' }, { status: 500 });
  }
}