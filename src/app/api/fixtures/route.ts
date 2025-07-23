// ===== src/app/api/fixtures/route.ts (Cache Warmer Enhanced) =====

import { NextResponse } from "next/server";
import axios from "axios";
import { format, addDays } from "date-fns";
import { ensureImagesCached } from "@/lib/server-utils"; // <-- IMPORT THE NEW UTILITY

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const leagueId = searchParams.get("league");
  const date = searchParams.get("date");
  const season = searchParams.get("season");

  const axiosOptions = (params: object) => ({
    method: "GET",
    url: `${process.env.NEXT_PUBLIC_API_FOOTBALL_HOST}/fixtures`,
    params,
    headers: {
      "x-apisports-key": process.env.NEXT_PUBLIC_API_FOOTBALL_KEY,
    },
  });

  try {
    let matchesData: any[] = [];

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
      matchesData = response.data.response.sort(
        (a: any, b: any) =>
          new Date(a.fixture.date).getTime() -
          new Date(b.fixture.date).getTime()
      );
    } else if (leagueId && date) {
      console.log(
        `API: Fetching fixtures for league ${leagueId}, date ${date}`
      );
      const response = await axios.request(
        axiosOptions({
          league: leagueId,
          season: new Date(date).getFullYear().toString(),
          date: date,
        })
      );
      matchesData = response.data.response;
    } else if (leagueId) {
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
      matchesData = response.data.response;
    } else if (date) {
      const response = await axios.request(axiosOptions({ date: date }));
      matchesData = response.data.response;
    } else {
      const todayStr = format(new Date(), "yyyy-MM-dd");
      const tomorrowStr = format(addDays(new Date(), 1), "yyyy-MM-dd");
      const [liveResponse, todayResponse, tomorrowResponse] = await Promise.all([
        axios.request(axiosOptions({ live: "all" })),
        axios.request(axiosOptions({ date: todayStr })),
        axios.request(axiosOptions({ date: tomorrowStr })),
      ]);
      const allMatches = [
        ...liveResponse.data.response,
        ...todayResponse.data.response,
        ...tomorrowResponse.data.response,
      ];
      matchesData = Array.from(
        new Map(allMatches.map((m) => [m.fixture.id, m])).values()
      );
    }

    // --- CACHE WARMING STEP ---
    if (matchesData && matchesData.length > 0) {
      // Collect all unique, valid URLs from the fetched match data
      const imageUrlsToCache = Array.from(
        new Set(
          matchesData.flatMap(match => [
            match.teams.home.logo,
            match.teams.away.logo,
            match.league.logo,
            match.league.flag
          ]).filter(url => typeof url === 'string' && url.startsWith('http'))
        )
      );
      
      // We don't need to `await` this. Let it run in the background 
      // to avoid delaying the response to the user.
      ensureImagesCached(imageUrlsToCache);
    }
    // --- END CACHE WARMING ---

    return NextResponse.json(matchesData);
    
  } catch (error) {
    console.error(`[API /fixtures] Error fetching fixture data:`, error);
    return NextResponse.json(
      { error: "Failed to fetch fixture data." },
      { status: 500 }
    );
  }
}