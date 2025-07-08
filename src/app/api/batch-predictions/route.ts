// src/app/api/batch-predictions/route.ts
import { NextResponse } from "next/server";
import axios from "axios";
// --- THE FIX: Import the new, standardized prediction engine ---
import { generatePrediction } from "@/lib/prediction-engine";
import { convertPercentageToOdds } from "@/lib/odds-converter";

type FanskorOdds = {
  home: string;
  draw: string;
  away: string;
};

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

    const fixtures: any[] | null = await apiRequest("fixtures", {
      ids: fixtureIds.join("-"),
    });

    if (!fixtures || fixtures.length === 0) {
      return NextResponse.json({});
    }

    // --- THE FIX: Fetch only the data needed by the accurate engine ---
    const dataPromises = fixtures.map(async (fixture) => {
      const { teams, league, fixture: fixtureDetails } = fixture;
      const [homeTeamStats, awayTeamStats, h2h, standings] = await Promise.all([
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
        apiRequest("fixtures/headtohead", {
          h2h: `${teams.home.id}-${teams.away.id}`,
        }),
        apiRequest("standings", { league: league.id, season: league.season }),
      ]);

      // If essential stats are missing, we can't make a prediction.
      if (!homeTeamStats || !awayTeamStats) {
        return { fixtureId: fixtureDetails.id, predictionData: null };
      }

      const leagueStandings = standings?.[0]?.league?.standings?.[0] || [];
      const homeTeamRank = leagueStandings.find(
        (s: any) => s.team.id === teams.home.id
      )?.rank;
      const awayTeamRank = leagueStandings.find(
        (s: any) => s.team.id === teams.away.id
      )?.rank;

      return {
        fixtureId: fixtureDetails.id,
        predictionData: {
          h2h,
          homeTeamStats,
          awayTeamStats,
          homeTeamId: teams.home.id,
          homeTeamRank,
          awayTeamRank,
          matchStatus: fixtureDetails.status.short,
        },
      };
    });

    const settledResults = await Promise.allSettled(dataPromises);
    const oddsMap: Record<number, FanskorOdds> = {};

    settledResults.forEach((result) => {
      if (result.status === "fulfilled" && result.value?.predictionData) {
        const { fixtureId, predictionData } = result.value;
        try {
          // --- THE FIX: Call the single, official prediction engine ---
          const predictionResult = generatePrediction(
            predictionData.h2h,
            predictionData.homeTeamStats,
            predictionData.awayTeamStats,
            predictionData.homeTeamId,
            predictionData.homeTeamRank,
            predictionData.awayTeamRank,
            null, // No events data in batch mode
            predictionData.matchStatus
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
      `[Batch Predictions] Successfully generated odds for ${
        Object.keys(oddsMap).length
      } fixtures using the standardized engine.`
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
