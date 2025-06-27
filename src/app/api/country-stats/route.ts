// src/app/api/country-stats/route.ts
import { NextResponse } from "next/server";
import axios from "axios";

// A curated list of popular league IDs to source teams from.
const POPULAR_LEAGUE_IDS = [
  39, 140, 135, 78, 61, 88, 94, 253, 2, 3, 45, 48, 71, 62, 144, 203, 197, 218,
];
const season = new Date().getFullYear();

export async function GET() {
  const options = (leagueId: number) => ({
    method: "GET",
    url: `${process.env.NEXT_PUBLIC_API_FOOTBALL_HOST}/teams`,
    params: { league: leagueId, season: season },
    headers: { "x-apisports-key": process.env.NEXT_PUBLIC_API_FOOTBALL_KEY },
  });

  try {
    const teamPromises = POPULAR_LEAGUE_IDS.map((id) =>
      axios.request(options(id))
    );
    const responses = await Promise.allSettled(teamPromises);

    const allTeamsResponses = responses
      .filter(
        (result) => result.status === "fulfilled" && result.value.data.response
      )
      .flatMap(
        (result) => (result as PromiseFulfilledResult<any>).value.data.response
      );

    // --- THIS IS THE FIX ---
    // 1. De-duplicate the teams first using a Map based on the unique team ID.
    // This ensures that a team like "Manchester City" which is in both the Premier League (39)
    // and the Champions League (2) is only processed once.
    const uniqueTeams = Array.from(
      new Map(allTeamsResponses.map((item) => [item.team.id, item])).values()
    );

    // 2. Now, count the de-duplicated teams.
    const countryTeamCounts: { [key: string]: number } = {};
    uniqueTeams.forEach((item) => {
      const countryName = item.team.country;
      if (countryName) {
        if (!countryTeamCounts[countryName]) {
          countryTeamCounts[countryName] = 0;
        }
        countryTeamCounts[countryName]++;
      }
    });

    return NextResponse.json(countryTeamCounts);
  } catch (error) {
    console.error("Error fetching country stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch country statistics." },
      { status: 500 }
    );
  }
}
