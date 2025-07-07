// src/app/api/batch-predictions/route.ts
import { NextResponse } from "next/server";
import axios from "axios";
import {
  generateSimplePrediction,
  PredictionResult,
} from "@/lib/prediction-engine";
import { convertPercentageToOdds } from "@/lib/odds-converter";
import {
  ApiSportsFixture,
  ApiSportsStandings,
} from "@/services/sportsApi/allsportsApiService";

type FanskorOdds = {
  home: string;
  draw: string;
  away: string;
};

// Reusable helper for making API-Football requests
const apiRequest = async (endpoint: string, params: object): Promise<any> => {
  const options = {
    method: "GET",
    url: `${process.env.NEXT_PUBLIC_API_FOOTBALL_HOST}/${endpoint}`,
    params,
    headers: { "x-apisports-key": process.env.NEXT_PUBLIC_API_FOOTBALL_KEY },
  };
  try {
    const response = await axios.request(options);
    return response.data.response;
  } catch (error) {
    console.error(
      `Error fetching from API-Football endpoint '${endpoint}':`,
      error
    );
    return []; // Return empty array on error to not break the entire batch
  }
};

/**
 * This API endpoint takes an array of fixture IDs, fetches all necessary data
 * for each fixture, runs the custom prediction engine, and returns a map
 * of fixture IDs to their calculated "Fanskor Odds".
 */
export async function POST(request: Request) {
  try {
    const { fixtureIds }: { fixtureIds: number[] } = await request.json();

    if (!Array.isArray(fixtureIds) || fixtureIds.length === 0) {
      return NextResponse.json(
        { error: "An array of fixture IDs is required." },
        { status: 400 }
      );
    }

    // 1. Fetch all fixture details in one batch
    const fixtures: ApiSportsFixture[] = await apiRequest("fixtures", {
      ids: fixtureIds.join("-"),
    });

    if (!fixtures || fixtures.length === 0) {
      return NextResponse.json({}, { status: 200 }); // Return empty if no valid fixtures found
    }

    // 2. Create an array of promises to fetch all necessary data for each fixture concurrently
    const dataPromises = fixtures.map(async (fixture) => {
      const { teams, league } = fixture;
      const [h2h, standings, homeTeamForm, awayTeamForm] = await Promise.all([
        apiRequest("fixtures/headtohead", {
          h2h: `${teams.home.id}-${teams.away.id}`,
        }),
        apiRequest("standings", { league: league.id, season: league.season }),
        apiRequest("fixtures", {
          team: teams.home.id,
          last: 5,
          season: league.season,
        }),
        apiRequest("fixtures", {
          team: teams.away.id,
          last: 5,
          season: league.season,
        }),
      ]);

      return {
        fixtureId: fixture.fixture.id,
        predictionData: {
          fixture,
          h2h,
          standings,
          homeTeamForm,
          awayTeamForm,
        },
      };
    });

    const allData = await Promise.all(dataPromises);

    // 3. Run the prediction engine for each fixture and create the final odds map
    const oddsMap: Record<number, FanskorOdds> = {};

    allData.forEach((data) => {
      if (data) {
        // Run the prediction engine
        const predictionResult: PredictionResult = generateSimplePrediction(
          data.predictionData
        );

        // Convert the raw prediction scores to percentages
        const totalScore =
          predictionResult.homeScore +
          predictionResult.awayScore +
          predictionResult.drawScore;
        const homePercent = (predictionResult.homeScore / totalScore) * 100;
        const awayPercent = (predictionResult.awayScore / totalScore) * 100;
        const drawPercent = (predictionResult.drawScore / totalScore) * 100;

        // Convert percentages to decimal odds
        oddsMap[data.fixtureId] = {
          home: convertPercentageToOdds(homePercent),
          draw: convertPercentageToOdds(drawPercent),
          away: convertPercentageToOdds(awayPercent),
        };
      }
    });

    return NextResponse.json(oddsMap);
  } catch (error) {
    console.error("[API/batch-predictions] Critical error:", error);
    return NextResponse.json(
      { error: "Failed to generate batch predictions." },
      { status: 500 }
    );
  }
}
