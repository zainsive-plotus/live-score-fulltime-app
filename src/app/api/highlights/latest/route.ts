// ===== src/app/api/highlights/latest/route.ts =====

import { NextResponse } from "next/server";
import { getLatestPopularHighlights } from "@/lib/data/highlightly";

export async function GET(request: Request) {
  try {
    // All complex logic is now handled by the service
    const latestHighlights = await getLatestPopularHighlights();

    const headers = new Headers();
    headers.set(
      "Cache-control",
      "public, s-maxage=300, stale-while-revalidate=600"
    );

    // The service already returns the data in the desired format
    return NextResponse.json(
      { highlights: latestHighlights },
      { status: 200, headers }
    );
  } catch (error: any) {
    console.error(
      `[API/highlights/latest] Error fetching popular highlights:`,
      error.message
    );
    return NextResponse.json(
      { error: "Failed to fetch latest highlights from the provider." },
      { status: 502 }
    );
  }
}
