// src/app/api/casino-partners/route.ts
import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import CasinoPartner from "@/models/CasinoPartner";

// GET handler to retrieve active Casino Partners for public display
export async function GET(request: Request) {
  await dbConnect();

  try {
    const { searchParams } = new URL(request.url);
    const featuredOnly = searchParams.get("featured") === "true";

    const query: { isActive: boolean; isFeatured?: boolean } = {
      isActive: true,
    };
    if (featuredOnly) {
      query.isFeatured = true;
    }

    // Sort by 'order' ascending (lower numbers first), then 'isFeatured' (true first), then random fallback
    // Random fallback helps if multiple partners have the same order/featured status, provides variety
    const partners = await CasinoPartner.aggregate([
      { $match: query }, // Filter by active and optionally featured
      { $addFields: { __rand: { $rand: {} } } }, // Add a random field for tie-breaking
      { $sort: { order: 1, isFeatured: -1, __rand: 1 } }, // Sort by order, then featured (desc), then random
      { $project: { __rand: 0 } }, // Remove the random field from output
      { $limit: 10 }, // Limit the number of partners returned to a reasonable amount
    ]);

    return NextResponse.json(partners, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching Casino Partners (Public):", error.message);
    return NextResponse.json(
      { error: "Server error fetching Casino Partners." },
      { status: 500 }
    );
  }
}
