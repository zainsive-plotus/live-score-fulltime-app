// ===== src/app/api/predictions/upcoming/route.ts =====

import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Prediction from "@/models/Prediction";
import { format } from "date-fns";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "12");
  const skip = (page - 1) * limit;

  try {
    await dbConnect();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [predictions, totalCount] = await Promise.all([
      Prediction.find({ fixtureDate: { $gte: today } })
        .sort({ fixtureDate: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Prediction.countDocuments({ fixtureDate: { $gte: today } }),
    ]);

    // The data is already in the correct format, so we can just rename the field.
    const formattedFixtures = predictions.map((p) => ({
      fixture: {
        id: p.fixtureId,
        date: p.fixtureDate,
        status: { short: p.status },
      },
      ...p,
    }));

    const hasNextPage = skip + limit < totalCount;

    return NextResponse.json({
      fixtures: formattedFixtures,
      nextPage: hasNextPage ? page + 1 : null,
    });
  } catch (error) {
    console.error(
      "[API/predictions/upcoming] Error fetching pre-generated predictions:",
      error
    );
    return NextResponse.json(
      { error: "Failed to fetch upcoming predictions." },
      { status: 500 }
    );
  }
}
