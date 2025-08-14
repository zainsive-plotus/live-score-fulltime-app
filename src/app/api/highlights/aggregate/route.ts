// ===== src/app/api/highlights/aggregate/route.ts =====

import { NextResponse } from "next/server";
import { getLatestPopularHighlights } from "@/lib/data/highlightly";

interface Highlight {
  id: string;
  title: string;
  thumbnailUrl: string;
  embedUrl: string;
  source: "Highlightly";
  publishedAt: string;
}

// Fetch and format latest highlights from Highlightly
const fetchHighlights = async (): Promise<Highlight[]> => {
  try {
    const highlights = await getLatestPopularHighlights();
    if (!highlights || highlights.length === 0) {
      return [];
    }

    // Transform the data to match our consistent Highlight interface
    return highlights.map((item: any) => ({
      id: `hl-${item.id}`,
      title: item.title,
      thumbnailUrl: item.thumbnail,
      embedUrl: item.embedUrl,
      source: "Highlightly",
      publishedAt: item.match.date,
    }));
  } catch (error) {
    console.error(
      "[Aggregate Highlights] Error fetching from Highlightly service:",
      error
    );
    return [];
  }
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");

    // Fetch all available highlights from our single source
    const allHighlights = await fetchHighlights();

    // The data from Highlightly should already be sorted by date, but we ensure it here.
    const sortedHighlights = allHighlights.sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );

    // Paginate the final sorted list
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedHighlights = sortedHighlights.slice(startIndex, endIndex);

    const hasNextPage = endIndex < sortedHighlights.length;

    return NextResponse.json({
      highlights: paginatedHighlights,
      nextPage: hasNextPage ? page + 1 : null,
      total: sortedHighlights.length,
    });
  } catch (error) {
    console.error(
      "[Highlights Aggregate API] A critical error occurred:",
      error
    );
    return NextResponse.json(
      { error: "Failed to aggregate highlights." },
      { status: 500 }
    );
  }
}
