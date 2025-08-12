// ===== src/app/api/admin/leagues/route.ts =====

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/dbConnect";
import League from "@/models/League";

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
      // Create a case-insensitive regex for searching
      const regex = new RegExp(searchQuery, "i");
      query.$or = [
        { name: { $regex: regex } },
        { countryName: { $regex: regex } },
      ];
    }

    const [leagues, totalCount] = await Promise.all([
      League.find(query)
        .sort({ countryName: 1, name: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      League.countDocuments(query),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      leagues,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
      },
    });
  } catch (error: any) {
    console.error("[API/admin/leagues] Error fetching leagues:", error);
    return NextResponse.json(
      { error: "Server error fetching leagues." },
      { status: 500 }
    );
  }
}
