import { NextResponse } from "next/server";
import { getPaginatedTeams } from "@/lib/data/team"; // <-- Import the new function

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "21");
    const searchQuery = searchParams.get("search") || "";

    // The API route now just calls our centralized logic
    const data = await getPaginatedTeams({ page, limit, searchQuery });

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("[API/teams/paginated] Server error fetching teams:", error);
    return NextResponse.json(
      { error: "Server error fetching paginated teams." },
      { status: 500 }
    );
  }
}
