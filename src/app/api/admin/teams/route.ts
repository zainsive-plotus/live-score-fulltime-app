// ===== src/app/api/admin/teams/route.ts =====

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/dbConnect";
import Team from "@/models/Team";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const searchQuery = searchParams.get("search") || "";

    const skip = (page - 1) * limit;

    const query: any = {};
    if (searchQuery) {
      const regex = new RegExp(searchQuery, "i");
      query.$or = [{ name: { $regex: regex } }, { country: { $regex: regex } }];
    }

    const [teams, totalCount] = await Promise.all([
      Team.find(query)
        .sort({ country: 1, name: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Team.countDocuments(query),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      teams,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
      },
    });
  } catch (error: any) {
    console.error("[API/admin/teams] Error fetching teams:", error);
    return NextResponse.json(
      { error: "Server error fetching teams." },
      { status: 500 }
    );
  }
}
