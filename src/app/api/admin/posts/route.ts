// ===== src/app/api/admin/posts/route.ts =====

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/dbConnect";
import Post, { NewsType } from "@/models/Post";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const newsType = searchParams.get("newsType") as NewsType | null;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = 10; // Number of translation groups per page
    const skip = (page - 1) * limit;

    const matchStage: any = {};
    if (newsType) {
      matchStage.newsType = newsType;
    }

    // This is a MongoDB Aggregation Pipeline. It's a powerful way to process data on the server.
    const aggregationPipeline = [
      // 1. Filter for specific news types if requested
      ...(Object.keys(matchStage).length > 0 ? [{ $match: matchStage }] : []),

      // 2. Sort all posts by date to ensure we can find the "master" post for a group
      { $sort: { createdAt: -1 } },

      // 3. Group posts by their translationGroupId
      {
        $group: {
          _id: { $ifNull: ["$translationGroupId", "$_id"] },
          // Push all documents of the group into an array
          posts: { $push: "$$ROOT" },
          // Keep the latest date of the group for sorting
          latestDate: { $first: "$createdAt" },
        },
      },

      // 4. Sort the GROUPS themselves by the latest date
      { $sort: { latestDate: -1 } },

      // 5. Use $facet to perform pagination and total count in one go
      {
        $facet: {
          paginatedGroups: [
            { $skip: skip },
            { $limit: limit },
            // We only need the array of posts from each group
            { $project: { _id: 0, posts: 1 } },
          ],
          totalCount: [{ $count: "count" }],
        },
      },
    ];

    const results = await Post.aggregate(aggregationPipeline);

    const paginatedResults = results[0].paginatedGroups;
    const totalCount = results[0].totalCount[0]
      ? results[0].totalCount[0].count
      : 0;
    const totalPages = Math.ceil(totalCount / limit);

    // The final data is an array of arrays (groups of posts)
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
