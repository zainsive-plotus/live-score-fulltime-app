// ===== src/app/api/highlights/latest/route.ts =====

import { NextResponse } from "next/server";
import { getLatestPopularHighlights } from "@/lib/data/highlightly";

export async function GET(request: Request) {
  try {
    // --- Start of Change ---
    // All complex fetching, validation, and caching logic is now encapsulated
    // in the getLatestPopularHighlights function. This route is now very simple.
    const validHighlights = await getLatestPopularHighlights();
    // --- End of Change ---

    if (!validHighlights || validHighlights.length === 0) {
      return NextResponse.json({ highlights: [] }, { status: 200 });
    }
    
    // Set a short browser/CDN cache time. The long-term cache is handled by Redis.
    const headers = new Headers();
    headers.set(
      "Cache-control",
      "public, s-maxage=300, stale-while-revalidate=600"
    );

    return NextResponse.json(
      { highlights: validHighlights },
      { status: 200, headers }
    );
  } catch (error: any) {
    console.error(
      `[API/highlights/latest] Error fetching latest highlights:`,
      error.message
    );
    return NextResponse.json(
      { error: "Failed to fetch latest highlights from the provider." },
      { status: 502 } // Use 502 Bad Gateway as we're proxying a failing service
    );
  }
}