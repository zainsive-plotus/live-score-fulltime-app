import { NextResponse } from "next/server";
import { getStandingsLeagues } from "@/lib/data/directory"; // <-- Import the new function

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "18");
    const searchQuery = searchParams.get("search") || "";

    // The API route now just calls our centralized logic
    const data = await getStandingsLeagues({ page, limit, searchQuery });

    return NextResponse.json(data);
  } catch (error) {
    console.error(
      "[API/standings-leagues] Error fetching paginated directory:",
      error
    );
    return NextResponse.json(
      { error: "Failed to fetch directory of leagues." },
      { status: 500 }
    );
  }
}
