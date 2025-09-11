// ===== src/app/api/fixtures/route.ts =====

import { NextResponse } from "next/server";
import axios from "axios";
import { format } from "date-fns";
import { leagueIdToPriorityMap } from "@/config/topLeaguesConfig";
import { getFixturesByDateRange } from "@/lib/data/fixtures";

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
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const groupByLeague = searchParams.get("groupByLeague") === "true";
  const status = searchParams.get("status") || "all";

  try {
    // --- CORE CHANGE: Handle date range grouping directly ---
    if (groupByLeague && from && to) {
      const allFixtures = await getFixturesByDateRange(from, to);

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
      leagueEntries.sort((a: any, b: any) => {
        const priorityA =
          leagueIdToPriorityMap.get(a.leagueInfo.id.toString()) || 999;
        const priorityB =
          leagueIdToPriorityMap.get(b.leagueInfo.id.toString()) || 999;
        if (priorityA !== priorityB) return priorityA - priorityB;
        if (a.leagueInfo.country !== b.leagueInfo.country)
          return a.leagueInfo.country.localeCompare(b.leagueInfo.country);
        return a.leagueInfo.name.localeCompare(b.leagueInfo.name);
      });

      return NextResponse.json({ leagueGroups: leagueEntries });
    }

    // Existing logic for single date grouping (unchanged)
    if (groupByLeague && date) {
      const { data } = await axios.get(
        `${process.env.NEXT_PUBLIC_API_FOOTBALL_HOST}/fixtures`,
        {
          params: { date },
          headers: {
            "x-apisports-key": process.env.NEXT_PUBLIC_API_FOOTBALL_KEY,
          },
        }
      );
      // ... (rest of the single-date grouping logic remains the same)
      const allFixtures = data.response;
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
            leagueInfo: { ...match.league },
            matches: [],
          };
        }
        acc[groupKey].matches.push(match);
        return acc;
      }, {});

      const leagueEntries = Object.values(groupedMatches);
      leagueEntries.sort((a: any, b: any) => {
        const priorityA =
          leagueIdToPriorityMap.get(a.leagueInfo.id.toString()) || 999;
        const priorityB =
          leagueIdToPriorityMap.get(b.leagueInfo.id.toString()) || 999;
        if (priorityA !== priorityB) return priorityA - priorityB;
        return a.leagueInfo.name.localeCompare(b.leagueInfo.name);
      });

      return NextResponse.json({ leagueGroups: leagueEntries });
    }

    // Fallback for other request types (unchanged)
    const response = await axios.get(
      `${process.env.NEXT_PUBLIC_API_FOOTBALL_HOST}/fixtures`,
      {
        params: { league: leagueId, season, from, to, date },
        headers: {
          "x-apisports-key": process.env.NEXT_PUBLIC_API_FOOTBALL_KEY,
        },
      }
    );
    return NextResponse.json(response.data.response);
  } catch (error) {
    console.error("[API/fixtures] Error fetching fixture data:", error);
    return NextResponse.json(
      { error: "Failed to fetch fixture data." },
      { status: 500 }
    );
  }
}
