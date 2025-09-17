// ===== src/app/api/highlights/latest/route.ts =====

import { NextResponse } from "next/server";
import { getLatestPopularHighlights } from "@/lib/data/highlightly";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get("limit");
    // Default to 40 if no limit is provided, for backward compatibility with other calls
    const limit = limitParam ? parseInt(limitParam, 10) : 40;

    const allHighlights = await getLatestPopularHighlights();

    if (!allHighlights || allHighlights.length === 0) {
      return NextResponse.json({ highlights: [] }, { status: 200 });
    }

    // Apply the limit AFTER fetching all available highlights
    const limitedHighlights = allHighlights.slice(0, limit);

    const headers = new Headers();
    headers.set(
      "Cache-control",
      "public, s-maxage=300, stale-while-revalidate=600"
    );

    return NextResponse.json(
      { highlights: limitedHighlights },
      { status: 200, headers }
    );
  } catch (error: any) {
    console.error(
      `[API/highlights/latest] Error fetching latest highlights:`,
      error.message
    );
    return NextResponse.json(
      { error: "Failed to fetch latest highlights from the provider." },
      { status: 502 }
    );
  }
}
