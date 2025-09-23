// ===== src/app/api/admin/posts/route.ts (UPDATED for Multilingual Search) =====

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/dbConnect";
import Post from "@/models/Post";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const searchQuery = searchParams.get("search") || "";
    const limit = 10;
    const skip = (page - 1) * limit;

    // --- AGGREGATION PIPELINE REVISED FOR MULTILINGUAL SEARCH ---

    // Initial stage to match any potentially linked documents first
    const preMatchStage: any = {};
    if (searchQuery.trim().length > 2) {
      const regex = new RegExp(searchQuery, "i");
      preMatchStage.$or = [
        { title: regex },
        // Pre-filter by linked IDs if we can, to reduce the lookup set.
        // This requires an additional lookup first, or assuming names are stored on the Post.
        // For simplicity and correctness, we will filter after grouping.
      ];
    }

    const aggregationPipeline: any[] = [
      // Sort all posts first
      { $sort: { createdAt: -1 } },

      // Group all posts by their translation group ID
      {
        $group: {
          _id: { $ifNull: ["$translationGroupId", "$_id"] },
          posts: { $push: "$$ROOT" },
          latestDate: { $first: "$createdAt" },
        },
      },

      // Now, perform lookups on the grouped documents' content
      {
        $lookup: {
          from: "teams",
          localField: "posts.linkedTeamId",
          foreignField: "teamId",
          as: "linkedTeamInfo",
        },
      },
      {
        $lookup: {
          from: "leagues",
          localField: "posts.linkedLeagueId",
          foreignField: "leagueId",
          as: "linkedLeagueInfo",
        },
      },
    ];

    // If a search query exists, apply the match stage *after* grouping and lookups
    if (searchQuery.trim().length > 2) {
      const regex = new RegExp(searchQuery, "i");
      aggregationPipeline.push({
        $match: {
          $or: [
            // Search within the array of post titles
            { "posts.title": regex },
            // Search within the names of the looked-up teams and leagues
            { "linkedTeamInfo.name": regex },
            { "linkedLeagueInfo.name": regex },
          ],
        },
      });
    }

    // Finally, add sorting, pagination, and final projection
    aggregationPipeline.push(
      { $sort: { latestDate: -1 } },
      {
        $facet: {
          paginatedGroups: [
            { $skip: skip },
            { $limit: limit },
            { $project: { _id: 0, posts: 1 } },
          ],
          totalCount: [{ $count: "count" }],
        },
      }
    );
    // --- END OF REVISED PIPELINE ---

    const results = await Post.aggregate(aggregationPipeline);

    const paginatedResults = results[0].paginatedGroups;
    const totalCount = results[0].totalCount[0]?.count || 0;
    const totalPages = Math.ceil(totalCount / limit);

    const groups = paginatedResults.map((group: any) => group.posts);

    return NextResponse.json({
      groups,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
      },
    });
  } catch (error) {
    console.error(
      "[API/admin/posts GET] Server error fetching posts for admin:",
      error
    );
    return NextResponse.json(
      { error: "Server error fetching posts" },
      { status: 500 }
    );
  }
}
