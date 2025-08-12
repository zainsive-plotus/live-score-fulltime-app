// ===== src/app/api/admin/leagues/metadata/route.ts =====

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/dbConnect";
import League from "@/models/League";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    await dbConnect();

    const [count, latestLeague] = await Promise.all([
      League.countDocuments(),
      League.findOne().sort({ updatedAt: -1 }).lean(),
    ]);

    return NextResponse.json({
      count,
      lastUpdated: latestLeague ? latestLeague.updatedAt : null,
    });
  } catch (error: any) {
    console.error(
      "[API/admin/leagues/metadata] Error fetching metadata:",
      error
    );
    return NextResponse.json(
      { error: "Server error fetching league metadata." },
      { status: 500 }
    );
  }
}
