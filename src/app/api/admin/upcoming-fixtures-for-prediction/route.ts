// src/app/api/admin/upcoming-fixtures-for-prediction/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/dbConnect";
import Post from "@/models/Post";
import axios from "axios";
import { format, addDays } from "date-fns";

// The list of leagues we want to generate predictions for.
const LEAGUES_TO_PREDICT = new Set([
  // Using a Set for efficient O(1) lookups.
  // Top 5 European Leagues
  39, 140, 135, 78, 61,
  // Major UEFA Competitions
  2, 3, 848,
  // Other Popular European Leagues
  88, 94, 203, 197, 218, 144,
  // Americas
  253, 262, 71, 128,
  // Key National Cups
  45, 143, 137, 81,
  // Other Active Leagues
  98, 292, 179,
  // International Club Competitions
  11, 13, 4,
]);

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await dbConnect();

  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get("limit") || "10");
  const skip = parseInt(searchParams.get("skip") || "0");

  // --- NEW, MORE RELIABLE STRATEGY ---
  // Create an array of API calls, one for each of the next 7 days.
  const datePromises = [];
  for (let i = 0; i < 7; i++) {
    const date = format(addDays(new Date(), i), "yyyy-MM-dd");
    const apiOptions = {
      method: "GET",
      url: `${process.env.NEXT_PUBLIC_API_FOOTBALL_HOST}/fixtures`,
      params: { date: date, timezone: "Europe/Istanbul" }, // Query for ALL matches on a specific date.
      headers: {
        "x-apisports-key": process.env.NEXT_PUBLIC_API_FOOTBALL_KEY,
      },
    };
    datePromises.push(axios.request(apiOptions));
  }

  try {
    const responses = await Promise.allSettled(datePromises);

    // Aggregate all fixtures from all successful daily requests.
    const allFetchedFixtures: any[] = responses
      .filter(
        (result) => result.status === "fulfilled" && result.value.data.response
      )
      .flatMap(
        (result) => (result as PromiseFulfilledResult<any>).value.data.response
      );

    console.log(
      `[API/upcoming-fixtures] Fetched a total of ${allFetchedFixtures.length} fixtures from the API across the next 7 days.`
    );

    // Now, filter this large list on our server.
    const finishedOrCancelledStatuses = new Set([
      "FT",
      "AET",
      "PEN",
      "PST",
      "CANC",
      "ABD",
      "AWD",
      "WO",
    ]);

    const upcomingFixtures = allFetchedFixtures.filter(
      (fixture) =>
        // 1. Must be from a league we care about.
        LEAGUES_TO_PREDICT.has(fixture.league.id) &&
        // 2. Must not be finished or cancelled.
        !finishedOrCancelledStatuses.has(fixture.fixture.status.short) &&
        // 3. Must have valid data.
        fixture.fixture &&
        fixture.fixture.id &&
        fixture.teams?.home &&
        fixture.teams?.away
    );

    console.log(
      `[API/upcoming-fixtures] Filtered down to ${upcomingFixtures.length} valid upcoming fixtures from our target leagues.`
    );

    // --- The rest of the logic remains the same ---

    // Fetch existing prediction posts to mark processed fixtures
    const fixtureIds = upcomingFixtures.map((f) => f.fixture.id);
    const processedPredictions = await Post.find({
      sport: "prediction",
      originalFixtureId: { $in: fixtureIds },
    })
      .select("originalFixtureId _id")
      .lean();

    const processedMap = new Map(
      processedPredictions.map((post) => [post.originalFixtureId, post._id])
    );

    const enhancedFixtures = upcomingFixtures.map((fixture) => ({
      ...fixture,
      processedPostId:
        processedMap.get(fixture.fixture.id)?.toString() || undefined,
    }));

    enhancedFixtures.sort((a, b) => {
      const dateA = new Date(a.fixture.date).getTime();
      const dateB = new Date(b.fixture.date).getTime();
      return dateA - dateB;
    });

    const paginatedFixtures = enhancedFixtures.slice(skip, skip + limit);

    return NextResponse.json(
      {
        fixtures: paginatedFixtures,
        totalCount: enhancedFixtures.length,
        currentPage: Math.floor(skip / limit) + 1,
        perPage: limit,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error(
      "[API/admin/upcoming-fixtures-for-prediction] Error fetching upcoming fixtures:",
      error.message
    );
    return NextResponse.json(
      { error: "Server error fetching upcoming fixtures for prediction." },
      { status: 500 }
    );
  }
}
