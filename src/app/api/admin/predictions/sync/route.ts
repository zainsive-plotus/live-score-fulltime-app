// ===== src/app/api/admin/predictions/sync/route.ts =====

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/dbConnect";
import Prediction from "@/models/Prediction";
import axios from "axios";
import { format, addDays } from "date-fns";
import { calculateCustomPrediction } from "@/lib/prediction-engine";
import { getH2H, getTeamStats, getStandings } from "@/lib/data/match";

const apiRequest = async (endpoint: string, params: object) => {
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
  } catch (error) {
    console.error(
      `[Prediction Sync] API request failed for ${endpoint}:`,
      error
    );
    return [];
  }
};

const getFormFromFixtures = (fixtures: any[], teamId: number): string => {
  if (!fixtures || fixtures.length === 0) return "";
  return fixtures
    .map((match: any) => {
      if (match.teams.home.winner)
        return match.teams.home.id === teamId ? "W" : "L";
      if (match.teams.away.winner)
        return match.teams.away.id === teamId ? "W" : "L";
      return "D";
    })
    .join("");
};

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    await dbConnect();
    const { days = 7 } = await request.json();

    const datePromises = [];
    for (let i = 0; i < days; i++) {
      const date = format(addDays(new Date(), i), "yyyy-MM-dd");
      datePromises.push(apiRequest("fixtures", { date }));
    }

    const responses = await Promise.all(datePromises);
    const allFixtures = responses.flat();
    const upcomingFixtures = allFixtures.filter(
      (f: any) => f.fixture.status.short === "NS"
    );

    const existingFixtureIds = new Set(
      (
        await Prediction.find({
          fixtureId: { $in: upcomingFixtures.map((f) => f.fixture.id) },
        })
          .select("fixtureId")
          .lean()
      ).map((p) => p.fixtureId)
    );

    const fixturesToProcess = upcomingFixtures.filter(
      (f) => !existingFixtureIds.has(f.fixture.id)
    );

    let processedCount = 0;
    const bulkOps = [];

    for (const fixture of fixturesToProcess) {
      const { league, teams, fixture: fixtureDetails } = fixture;
      const { home, away } = teams;

      try {
        const [
          h2h,
          homeTeamStats,
          awayTeamStats,
          standingsResponse,
          homeLast10,
          awayLast10,
        ] = await Promise.all([
          getH2H(home.id, away.id),
          getTeamStats(league.id, league.season, home.id),
          getTeamStats(league.id, league.season, away.id),
          getStandings(league.id, league.season),
          apiRequest("fixtures", { team: home.id, last: 10 }),
          apiRequest("fixtures", { team: away.id, last: 10 }),
        ]);

        if (!homeTeamStats || !awayTeamStats) continue;

        const flatStandings =
          standingsResponse?.[0]?.league?.standings?.flat() || [];
        const homeTeamRank = flatStandings.find(
          (s: any) => s.team.id === home.id
        )?.rank;
        const awayTeamRank = flatStandings.find(
          (s: any) => s.team.id === away.id
        )?.rank;

        const prediction = calculateCustomPrediction(
          h2h,
          homeTeamStats,
          awayTeamStats,
          home.id,
          homeTeamRank,
          awayTeamRank,
          null,
          fixtureDetails.status.short
        );

        const predictionDocument = {
          fixtureId: fixtureDetails.id,
          fixtureDate: new Date(fixtureDetails.date),
          status: fixtureDetails.status.short,
          teams: {
            home: { id: home.id, name: home.name, logo: home.logo },
            away: { id: away.id, name: away.name, logo: away.logo },
          },
          league: { id: league.id, name: league.name, logo: league.logo },
          prediction,
          h2h: h2h || [],
          form: {
            home: getFormFromFixtures(homeLast10, home.id),
            away: getFormFromFixtures(awayLast10, away.id),
          },
        };

        bulkOps.push({
          updateOne: {
            filter: { fixtureId: fixtureDetails.id },
            update: { $set: predictionDocument },
            upsert: true,
          },
        });
        processedCount++;
      } catch (error) {
        console.error(
          `[Prediction Sync] Failed to process fixture ${fixture.fixture.id}:`,
          error
        );
      }
      await new Promise((resolve) => setTimeout(resolve, 250)); // Rate limit buffer
    }

    if (bulkOps.length > 0) {
      await Prediction.bulkWrite(bulkOps);
    }

    return NextResponse.json({
      message: `Sync complete. Processed ${processedCount} new predictions.`,
      newPredictions: processedCount,
      skipped: upcomingFixtures.length - fixturesToProcess.length,
    });
  } catch (error) {
    console.error("[Prediction Sync] A critical error occurred:", error);
    return NextResponse.json(
      { error: "Server error during prediction sync." },
      { status: 500 }
    );
  }
}
