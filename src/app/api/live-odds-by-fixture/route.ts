// src/app/api/live-odds-by-fixture/route.ts
import { NextResponse } from "next/server";
import axios from "axios";

// --- Data Transformation Helper ---
// This function finds a specific bet type by its ID and extracts the main odds.
const extractMainOdds = (odds: any[], betId: number, valueKeys: string[]) => {
  const betData = odds.find((o) => o.id === betId);
  if (!betData) return null;

  // Prefer the 'main' market if available, otherwise take the first valid one.
  let targetValues = betData.values.find((v: any) => v.main === true)
    ? betData.values.filter((v: any) => v.main === true)
    : betData.values;

  const result: { [key: string]: string | null } = {};
  valueKeys.forEach((key) => {
    result[key.toLowerCase()] =
      targetValues.find((v: any) => v.value === key)?.odd || null;
  });

  // Also extract the handicap if present
  result.handicap = targetValues[0]?.handicap || null;

  // Check if we found any valid odds
  const hasValues = Object.values(result).some(
    (v) => v !== null && v !== undefined
  );
  return hasValues ? result : null;
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const fixtureId = searchParams.get("fixture");

  if (!fixtureId) {
    return NextResponse.json(
      { error: "Fixture ID is required" },
      { status: 400 }
    );
  }

  const options = {
    method: "GET",
    url: `${process.env.NEXT_PUBLIC_API_FOOTBALL_HOST}/odds/live`,
    params: { fixture: fixtureId },
    headers: { "x-apisports-key": process.env.NEXT_PUBLIC_API_FOOTBALL_KEY },
  };

  try {
    const response = await axios.request(options);
    const liveData = response.data.response[0];

    if (!liveData || !liveData.odds) {
      return NextResponse.json(null); // Return null if no live odds are available
    }

    const odds = liveData.odds;

    // Curate and simplify the data before sending to the frontend
    const curatedOdds = {
      asianHandicap: extractMainOdds(odds, 33, ["Home", "Away"]),
      overUnder: extractMainOdds(odds, 36, ["Over", "Under"]),
      matchCorners: extractMainOdds(odds, 20, ["Over", "Under"]),
      nextGoal: extractMainOdds(odds, 85, ["1", "No goal", "2"]),
    };

    return NextResponse.json(curatedOdds);
  } catch (error) {
    console.error(`Error fetching live odds for fixture ${fixtureId}:`, error);
    return NextResponse.json(
      { error: "Failed to fetch live odds" },
      { status: 500 }
    );
  }
}
