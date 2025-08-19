// ===== src/app/api/fixtures/route.ts =====

import { NextResponse } from "next/server";
import axios from "axios";
import { format, addDays } from "date-fns";
import { leagueIdToPriorityMap } from "@/config/topLeaguesConfig"; // ADD: Import the priority map

const STATUS_MAP: Record<string, string[]> = {
  all: [],
  live: ["1H", "HT", "2H", "ET", "P", "LIVE"],
  finished: ["FT", "AET", "PEN"],
  scheduled: ["NS", "TBD", "PST"],
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const leagueId = searchParams.get("league");
  const date = searchParams.get("date");
  const season = searchParams.get("season");

  const groupByLeague = searchParams.get("groupByLeague") === "true";
  const status = searchParams.get("status") || "all";
  const page = parseInt(searchParams.get("page") || "0", 10);
  const limit = parseInt(searchParams.get("limit") || "0", 10);

  const axiosOptions = (params: object) => ({
    method: "GET",
    url: `${process.env.NEXT_PUBLIC_API_FOOTBALL_HOST}/fixtures`,
    params,
    headers: {
      "x-apisports-key": process.env.NEXT_PUBLIC_API_FOOTBALL_KEY,
    },
  });

  try {
    if (groupByLeague) {
      const fetchDate = date || format(new Date(), "yyyy-MM-dd");
      const allFixtures = (
        await axios.request(axiosOptions({ date: fetchDate }))
      ).data.response;

      const statusFilter = STATUS_MAP[status] || [];
      const matchesToGroup =
        statusFilter.length > 0
          ? allFixtures.filter((m: any) =>
              statusFilter.includes(m.fixture.status.short)
            )
          : allFixtures;

      const groupedMatches = matchesToGroup.reduce((acc: any, match: any) => {
        const groupKey = match.league.id;
        if (!acc[groupKey]) {
          acc[groupKey] = {
            leagueInfo: {
              id: match.league.id,
              name: match.league.name,
              logo: match.league.logo,
              country: match.league.country,
              flag: match.league.flag,
            },
            matches: [],
          };
        }
        acc[groupKey].matches.push(match);
        return acc;
      }, {});

      const leagueEntries = Object.values(groupedMatches);

      // CHANGE: Add sorting logic based on the priority map
      leagueEntries.sort((a: any, b: any) => {
        const priorityA =
          leagueIdToPriorityMap.get(a.leagueInfo.id.toString()) || 999;
        const priorityB =
          leagueIdToPriorityMap.get(b.leagueInfo.id.toString()) || 999;

        if (priorityA !== priorityB) {
          return priorityA - priorityB;
        }
        // If priorities are the same, sort by country and then league name
        if (a.leagueInfo.country !== b.leagueInfo.country) {
          return a.leagueInfo.country.localeCompare(b.leagueInfo.country);
        }
        return a.leagueInfo.name.localeCompare(b.leagueInfo.name);
      });

      if (limit > 0 && page > 0) {
        const totalLeagues = leagueEntries.length;
        const totalPages = Math.ceil(totalLeagues / limit);
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedLeagueGroups = leagueEntries.slice(startIndex, endIndex);

        return NextResponse.json({
          paginatedLeagueGroups,
          pagination: { currentPage: page, totalPages, totalLeagues },
        });
      } else {
        return NextResponse.json({ leagueGroups: leagueEntries });
      }
    }

    // ... (rest of the file for non-grouped fetches remains unchanged)
    let matchesData: any[] = [];

    if (leagueId && season) {
      const response = await axios.request(
        axiosOptions({ league: leagueId, season: season })
      );
      matchesData = response.data.response.sort(
        (a: any, b: any) =>
          new Date(a.fixture.date).getTime() -
          new Date(b.fixture.date).getTime()
      );
    } else if (leagueId && date) {
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
      matchesData = Array.from(
        new Map(allMatches.map((m) => [m.fixture.id, m])).values()
      );
    }

    return NextResponse.json(matchesData);
  } catch (error) {
    console.error("[API/fixtures] Failed to fetch fixture data:", error);
    return NextResponse.json(
      { error: "Failed to fetch fixture data." },
      { status: 500 }
    );
  }
}
