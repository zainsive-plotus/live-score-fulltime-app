// ===== src/app/api/admin/predictions/[...action]/route.ts =====

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/dbConnect";
import Prediction from "@/models/Prediction";

interface Params {
  params: { action: string[] };
}

export async function GET(request: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const action = params.action[0];

  try {
    await dbConnect();

    if (action === "metadata") {
      const [count, latestPrediction] = await Promise.all([
        Prediction.countDocuments(),
        Prediction.findOne().sort({ updatedAt: -1 }).lean(),
      ]);
      return NextResponse.json({
        count,
        lastUpdated: latestPrediction ? latestPrediction.updatedAt : null,
      });
    }

    // Default GET action is to list predictions
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "15");
    const skip = (page - 1) * limit;

    const [predictions, totalCount] = await Promise.all([
      Prediction.find({})
        .sort({ fixtureDate: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Prediction.countDocuments({}),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      predictions,
      pagination: { currentPage: page, totalPages, totalCount },
    });
  } catch (error: any) {
    console.error(`[API/admin/predictions/${action}] Error:`, error);
    return NextResponse.json(
      { error: `Server error during action: ${action}.` },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const action = params.action[0];
  if (action !== "clear") {
    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  }

  try {
    await dbConnect();
    await Prediction.deleteMany({});
    return NextResponse.json({
      message: "All predictions have been cleared successfully.",
    });
  } catch (error: any) {
    console.error(`[API/admin/predictions/clear] Error:`, error);
    return NextResponse.json(
      { error: "Server error while clearing predictions." },
      { status: 500 }
    );
  }
}
