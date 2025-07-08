// src/app/api/batch-predictions/route.ts
import { NextResponse } from "next/server";
import axios from "axios";
import { generateHybridPrediction } from "@/lib/prediction-engine"; // Import our new hybrid engine
import { convertPercentageToOdds } from "@/lib/odds-converter";

type FanskorOdds = {
  home: string;
  draw: string;
  away: string;
};

// This helper is still useful for making requests robustly
const apiRequest = async (
  endpoint: string,
  params: object
): Promise<any | null> => {
  const options = {
    method: "GET",
    url: `${process.env.NEXT_PUBLIC_API_FOOTBALL_HOST}/${endpoint}`,
    params,
    headers: { "x-apisports-key": process.env.NEXT_PUBLIC_API_FOOTBALL_KEY },
    timeout: 8000,
  };
  try {
    const response = await axios.request(options);
    return response.data.response;
  } catch (error: any) {
    console.error(
      `[API-Football Sub-Request Error] Endpoint: '${endpoint}', Params: ${JSON.stringify(
        params
      )}, Error: ${error.message}`
    );
    return null;
  }
};

export async function POST(request: Request) {
  try {
    const { fixtureIds }: { fixtureIds: number[] } = await request.json();

    if (!Array.isArray(fixtureIds) || fixtureIds.length === 0) {
      return NextResponse.json(
        { error: "An array of fixture IDs is required." },
        { status: 400 }
      );
    }
    console.log(
      `[Batch Predictions] Received request for ${fixtureIds.length} fixtures.`
    );

    const fixtures: any[] | null = await apiRequest("fixtures", {
      ids: fixtureIds.join("-"),
    });

    if (!fixtures || fixtures.length === 0) {
      console.warn(
        "[Batch Predictions] No valid fixtures found from initial ID fetch."
      );
      return NextResponse.json({});
    }

    // Create promises to fetch all necessary data for each fixture
    const dataPromises = fixtures.map(async (fixture) => {
      const { teams, league } = fixture;

      // Fetch stats and bookmaker odds in parallel
      const [homeTeamStats, awayTeamStats, oddsData] = await Promise.all([
        apiRequest("teams/statistics", {
          league: league.id,
          season: league.season,
          team: teams.home.id,
        }),
        apiRequest("teams/statistics", {
          league: league.id,
          season: league.season,
          team: teams.away.id,
        }),
        apiRequest("odds", {
          fixture: fixture.fixture.id,
          bookmaker: 8,
          bet: 1,
        }), // Bet365, Match Winner
      ]);

      // If team stats are missing, we cannot proceed. Odds are optional.
      if (!homeTeamStats || !awayTeamStats) {
        return { fixtureId: fixture.fixture.id, predictionData: null };
      }

      // Extract the relevant odds values if they exist
      const bookmakerOdds = oddsData?.[0]?.bookmakers?.[0]?.bets?.[0]?.values;
      const odds = bookmakerOdds
        ? {
            home:
              bookmakerOdds.find((v: any) => v.value === "Home")?.odd || null,
            draw:
              bookmakerOdds.find((v: any) => v.value === "Draw")?.odd || null,
            away:
              bookmakerOdds.find((v: any) => v.value === "Away")?.odd || null,
          }
        : null;

      // Ensure all three odds values are present to be considered valid
      const validOdds =
        odds && odds.home && odds.draw && odds.away ? odds : null;

      return {
        fixtureId: fixture.fixture.id,
        predictionData: {
          homeTeamStats,
          awayTeamStats,
          bookmakerOdds: validOdds,
        },
      };
    });

    const settledResults = await Promise.allSettled(dataPromises);
    console.log(
      `[Batch Predictions] All sub-requests settled. Processing ${settledResults.length} results.`
    );

    const oddsMap: Record<number, FanskorOdds> = {};

    settledResults.forEach((result) => {
      if (result.status === "fulfilled" && result.value?.predictionData) {
        const { fixtureId, predictionData } = result.value;
        try {
          const predictionResult = generateHybridPrediction(
            predictionData.homeTeamStats,
            predictionData.awayTeamStats,
            predictionData.bookmakerOdds // Pass the bookmaker odds to the engine
          );

          oddsMap[fixtureId] = {
            home: convertPercentageToOdds(predictionResult.home),
            draw: convertPercentageToOdds(predictionResult.draw),
            away: convertPercentageToOdds(predictionResult.away),
          };
        } catch (engineError: any) {
          console.error(
            `[Prediction Engine Error] for fixture ${fixtureId}: ${engineError.message}`
          );
        }
      } else if (result.status === "rejected") {
        console.error(
          `[Batch Predictions] Data promise failed for a fixture:`,
          result.reason
        );
      }
    });

    console.log(
      `[Batch Predictions] Successfully generated hybrid odds for ${
        Object.keys(oddsMap).length
      } fixtures.`
    );
    return NextResponse.json(oddsMap);
  } catch (error) {
    console.error(
      "[Batch Predictions] Critical unhandled error in POST handler:",
      error
    );
    return NextResponse.json(
      {
        error:
          "Failed to generate batch predictions due to a critical server error.",
      },
      { status: 500 }
    );
  }
}
