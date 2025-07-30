// ===== src/lib/data/news.ts =====

import "server-only";
import dbConnect from "@/lib/dbConnect";
import Post, { IPost, NewsType, SportsCategory } from "@/models/Post";

const DEFAULT_LOCALE = "tr";

interface GetNewsParams {
  locale: string;
  sportsCategory?: SportsCategory;
  excludeSportsCategory?: SportsCategory;
  newsType?: NewsType; // <-- This is the new parameter
}

export async function getNews(params: GetNewsParams): Promise<IPost[]> {
  const { locale, sportsCategory, excludeSportsCategory, newsType } = params;

  try {
    await dbConnect();

    // --- Start of Change ---
    // The match stage is now more flexible to handle all filter types.
    const matchStage: any = { status: "published" };
    if (sportsCategory) {
      matchStage.sportsCategory = { $in: [sportsCategory] };
    }
    if (excludeSportsCategory) {
      // Ensure we don't overwrite the sportsCategory filter if it exists
      if (matchStage.sportsCategory) {
        matchStage.sportsCategory.$nin = [excludeSportsCategory];
      } else {
        matchStage.sportsCategory = { $nin: [excludeSportsCategory] };
      }
    }
    // Add the new filter for newsType
    if (newsType) {
      matchStage.newsType = newsType;
    }
    // --- End of Change ---

    const pipeline = [
      { $match: matchStage },
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
      {
        $sort: {
          effectiveGroupId: 1,
          langPriority: 1,
        },
      },
      {
        $group: {
          _id: "$effectiveGroupId",
          document: { $first: "$$ROOT" },
        },
      },
      {
        $replaceRoot: {
          newRoot: "$document",
        },
      },
      {
        $sort: {
          createdAt: -1,
        },
      },
    ];

    const curatedNews = await Post.aggregate(pipeline);

    return JSON.parse(JSON.stringify(curatedNews));
  } catch (error) {
    console.error(`[getNews Data Fetching Error]`, error);
    return [];
  }
}