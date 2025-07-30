// ===== src/app/api/recent-news/route.ts =====

import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import RecentNews, { IRecentNews } from "@/models/RecentNews";

const DEFAULT_LOCALE = "tr";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const locale = searchParams.get("locale") || DEFAULT_LOCALE;
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? parseInt(limitParam, 10) : 10;

    await dbConnect();

    // The aggregation pipeline is similar to the one for Posts,
    // ensuring we get one unique, correctly localized entry per translation group.
    const pipeline = [
      { $match: { language: { $exists: true } } }, // Basic filter
      {
        $addFields: {
          effectiveGroupId: { $ifNull: ["$translationGroupId", "$_id"] },
        },
      },
      {
        $addFields: {
          langPriority: {
            $cond: {
              if: { $eq: ["$language", locale] },
              then: 1,
              else: {
                $cond: {
                  if: { $eq: ["$language", DEFAULT_LOCALE] },
                  then: 2,
                  else: 3,
                },
              },
            },
          },
        },
      },
      { $sort: { effectiveGroupId: 1, langPriority: 1 } },
      {
        $group: {
          _id: "$effectiveGroupId",
          document: { $first: "$$ROOT" },
        },
      },
      { $replaceRoot: { newRoot: "$document" } },
      { $sort: { createdAt: -1 } },
      { $limit: limit },
    ];

    const recentNewsItems: IRecentNews[] = await RecentNews.aggregate(pipeline);
    
    return NextResponse.json(recentNewsItems);
  } catch (error) {
    console.error("[API/recent-news] Error fetching recent news items:", error);
    return NextResponse.json(
      { error: "Server error fetching recent news" },
      { status: 500 }
    );
  }
}