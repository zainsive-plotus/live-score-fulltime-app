// ===== src/app/api/admin/seo-content/paginated/route.ts =====

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/dbConnect";
import SeoContent from "@/models/SeoContent";
import axios from "axios";

const BASE_URL =
  process.env.NEXT_PUBLIC_PUBLIC_APP_URL || "http://localhost:3000";

// Helper to get the master list of all possible entities for a page type
const getAllEntities = async (
  pageType: string
): Promise<{ id: string; name: string }[]> => {
  switch (pageType) {
    case "league-standings":
      const { data: leagueData } = await axios.get(
        `${BASE_URL}/api/directory/standings-leagues?limit=10000`
      );
      return leagueData.leagues.map((l: any) => ({
        id: l.id.toString(),
        name: l.name,
      }));
    case "team-details":
      const { data: teamData } = await axios.get(
        `${BASE_URL}/api/directory/teams-all`
      );
      return teamData.map((t: any) => ({ id: t.id.toString(), name: t.name }));
    default:
      return [];
  }
};

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const pageType = searchParams.get("pageType");
    const searchQuery = searchParams.get("search") || "";
    const skip = (page - 1) * limit;

    if (!pageType) {
      return NextResponse.json(
        { error: "pageType is required." },
        { status: 400 }
      );
    }

    // 1. Get all possible entities and filter them by the search query
    const allEntities = await getAllEntities(pageType);
    const filteredEntities =
      searchQuery.length >= 2
        ? allEntities.filter((entity) =>
            entity.name.toLowerCase().includes(searchQuery.toLowerCase())
          )
        : allEntities;

    const totalCount = filteredEntities.length;
    const totalPages = Math.ceil(totalCount / limit);

    // 2. Paginate the *filtered* list of entities to get the IDs for the current page
    const paginatedEntityIds = filteredEntities
      .slice(skip, skip + limit)
      .map((e) => e.id);

    if (paginatedEntityIds.length === 0) {
      return NextResponse.json({
        contentGroups: [],
        pagination: { currentPage: page, totalPages, totalCount },
      });
    }

    // 3. Fetch all SEO content documents for the entity IDs on the current page
    const contentItems = await SeoContent.find({
      pageType,
      entityId: { $in: paginatedEntityIds },
    }).lean();

    // 4. Group the results by entityId
    const groups: Record<string, any[]> = {};
    contentItems.forEach((item) => {
      if (!groups[item.entityId]) {
        groups[item.entityId] = [];
      }
      groups[item.entityId].push(item);
    });

    // 5. Ensure the final output is ordered correctly based on the paginated entity list
    const orderedGroups = paginatedEntityIds
      .map((id) => groups[id] || [])
      .filter((g) => g.length > 0);

    return NextResponse.json({
      contentGroups: orderedGroups,
      pagination: { currentPage: page, totalPages, totalCount },
    });
  } catch (error) {
    console.error("[API/seo-content/paginated] Error:", error);
    return NextResponse.json(
      { error: "Server error fetching paginated SEO content." },
      { status: 500 }
    );
  }
}
