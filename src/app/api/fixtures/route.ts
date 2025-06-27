import { NextResponse } from "next/server";
import axios from "axios";
import { format, addDays } from "date-fns";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const leagueId = searchParams.get("league");
  const date = searchParams.get("date");
  const season = searchParams.get("season");

  // Base options for axios requests
  const axiosOptions = (params: object) => ({
    method: "GET",
    url: `${process.env.NEXT_PUBLIC_API_FOOTBALL_HOST}/fixtures`,
    params,
    headers: {
      "x-apisports-key": process.env.NEXT_PUBLIC_API_FOOTBALL_KEY,
    },
  });

  try {
    // --- PATTERN 1: Get all fixtures for a specific LEAGUE and SEASON ---
    // Used by the new "Season View" in the LeagueFixturesTab.
    if (leagueId && season) {
      console.log(
        `API: Fetching all fixtures for league ${leagueId}, season ${season}`
      );
      const response = await axios.request(
        axiosOptions({
          league: leagueId,
          season: season,
        })
      );
      // Sort matches by date, as the API might not return them in chronological order
      const sortedMatches = response.data.response.sort(
        (a: any, b: any) =>
          new Date(a.fixture.date).getTime() -
          new Date(b.fixture.date).getTime()
      );
      return NextResponse.json(sortedMatches);
    }

    // --- PATTERN 2: Get all fixtures for a specific LEAGUE and DATE ---
    // Used by the original day-by-day fixtures tab.
    if (leagueId && date) {
      console.log(
        `API: Fetching fixtures for league ${leagueId}, date ${date}`
      );
      const response = await axios.request(
        axiosOptions({
          league: leagueId,
          season: new Date(date).getFullYear().toString(), // Use the year from the date for the season
          date: date,
        })
      );
      return NextResponse.json(response.data.response);
    }

    // --- PATTERN 3: Get upcoming matches for a specific LEAGUE ---
    // Used by the homepage slider when a league is selected.
    if (leagueId) {
      console.log(`API: Fetching upcoming fixtures for league ${leagueId}`);
      const today = format(new Date(), "yyyy-MM-dd");
      const nextSevenDays = format(addDays(new Date(), 7), "yyyy-MM-dd");
      const response = await axios.request(
        axiosOptions({
          league: leagueId,
          season: new Date().getFullYear().toString(),
          from: today,
          to: nextSevenDays,
        })
      );
      return NextResponse.json(response.data.response);
    }

    // --- PATTERN 4: Get GLOBAL matches (live, today, tomorrow) if no league is specified ---
    // This is the default for the homepage.
    if (!leagueId) {
      // If a specific date is provided for the global view, use it.
      if (date) {
        console.log(`API: Fetching global fixtures for date ${date}`);
        const response = await axios.request(axiosOptions({ date: date }));
        return NextResponse.json(response.data.response);
      }

      // Fallback to the original "live, today, tomorrow" logic if no date is provided.
      console.log("API: Fetching global matches (live, today, tomorrow)");
      const todayStr = format(new Date(), "yyyy-MM-dd");
      const tomorrowStr = format(addDays(new Date(), 1), "yyyy-MM-dd");

      const [liveResponse, todayResponse, tomorrowResponse] = await Promise.all(
        [
          axios.request(axiosOptions({ live: "all" })),
          axios.request(axiosOptions({ date: todayStr })),
          axios.request(axiosOptions({ date: tomorrowStr })),
        ]
      );

      const allMatches = [
        ...liveResponse.data.response,
        ...todayResponse.data.response,
        ...tomorrowResponse.data.response,
      ];

      const uniqueMatches = Array.from(
        new Map(allMatches.map((m) => [m.fixture.id, m])).values()
      );
      return NextResponse.json(uniqueMatches);
    }

    return NextResponse.json([]);
  } catch (error) {
    console.error("Error in /api/fixtures:", error);
    return NextResponse.json(
      { error: "Failed to fetch fixture data." },
      { status: 500 }
    );
  }
}
