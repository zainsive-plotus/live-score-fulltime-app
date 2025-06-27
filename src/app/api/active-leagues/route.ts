// src/app/api/active-leagues/route.ts
import { NextResponse } from "next/server";
import axios from "axios";
import { format, addDays } from "date-fns";

// A curated list of leagues to check for activity.
// Checking EVERY single league would be too slow and hit API rate limits.
// This list should contain leagues you generally expect to be active.
const LEAGUES_TO_CHECK = [
  39,
  140,
  135,
  78,
  61,
  2,
  3,
  88,
  94,
  253,
  45,
  48,
  71,
  62,
  144,
  203,
  197,
  218, // Premier League, La Liga, Serie A, Bundesliga, Ligue 1, UCL, UEL, Eredivisie, etc.
];

export async function GET() {
  const today = format(new Date(), "yyyy-MM-dd");
  const nextSevenDays = format(addDays(new Date(), 7), "yyyy-MM-dd");

  const options = (leagueId: number) => ({
    method: "GET",
    url: `${process.env.NEXT_PUBLIC_API_FOOTBALL_HOST}/fixtures`,
    params: {
      league: leagueId,
      season: new Date().getFullYear().toString(),
      from: today,
      to: nextSevenDays,
    },
    headers: { "x-apisports-key": process.env.NEXT_PUBLIC_API_FOOTBALL_KEY },
  });

  try {
    // Create an array of promises, one for each league check
    const fixtureChecks = LEAGUES_TO_CHECK.map((id) =>
      axios.request(options(id)).then((response) => ({
        leagueId: id,
        hasFixtures: response.data.results > 0,
      }))
    );

    // Execute all checks in parallel
    const results = await Promise.allSettled(fixtureChecks);

    // Filter out failed requests and leagues with no fixtures
    const activeLeagueIds = results
      .filter(
        (result) => result.status === "fulfilled" && result.value.hasFixtures
      )
      .map(
        (result) =>
          (result as PromiseFulfilledResult<{ leagueId: number }>).value
            .leagueId
      );

    return NextResponse.json(activeLeagueIds);
  } catch (error) {
    console.error("Error fetching active leagues:", error);
    return NextResponse.json(
      { error: "Failed to determine active leagues." },
      { status: 500 }
    );
  }
}
