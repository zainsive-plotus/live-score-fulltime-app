// ===== src/lib/data/news.ts =====

import "server-only";
import dbConnect from "@/lib/dbConnect";
import Post, { IPost, NewsType, SportsCategory } from "@/models/Post";

const DEFAULT_LOCALE = "tr";

// --- CORE CHANGE: Added linkedLeagueId and linkedTeamId to the interface ---
interface GetNewsParams {
  locale: string;
  sportsCategory?: SportsCategory;
  newsType?: NewsType;
  page?: number;
  limit?: number;
  linkedFixtureId?: number;
  linkedLeagueId?: number;
  linkedTeamId?: number;
}

export async function getNews(params: GetNewsParams): Promise<{
  posts: IPost[];
  pagination: { totalCount: number; totalPages: number };
}> {
  const {
    locale,
    sportsCategory,
    newsType,
    page = 1,
    limit = 10,
    linkedFixtureId,
    linkedLeagueId, // <-- New parameter
    linkedTeamId, // <-- New parameter
  } = params;

  try {
    await dbConnect();

    const matchConditions: any[] = [{ status: "published" }];

    if (sportsCategory) {
      matchConditions.push({ sportsCategory: { $in: [sportsCategory] } });
    }
    if (newsType) {
      matchConditions.push({ newsType: newsType });
    }
    if (linkedFixtureId) {
      matchConditions.push({ linkedFixtureId: linkedFixtureId });
    }
    // --- CORE CHANGE: Add the new filters to the match conditions ---
    if (linkedLeagueId) {
      matchConditions.push({ linkedLeagueId: linkedLeagueId });
    }
    if (linkedTeamId) {
      matchConditions.push({ linkedTeamId: linkedTeamId });
    }

    const matchStage = { $and: matchConditions };

    const skip = (page - 1) * limit;

    // The aggregation pipeline remains the same, it just uses the updated matchStage
    const aggregationPipeline = [
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
      { $sort: { effectiveGroupId: 1, langPriority: 1 } },
      { $group: { _id: "$effectiveGroupId", document: { $first: "$$ROOT" } } },
      { $replaceRoot: { newRoot: "$document" } },
      { $sort: { createdAt: -1 } },
    ];

    const facetPipeline = [
      ...aggregationPipeline,
      {
        $facet: {
          paginatedResults: [{ $skip: skip }, { $limit: limit }],
          totalCount: [{ $count: "count" }],
        },
      },
    ];

    const results = await Post.aggregate(facetPipeline);

    const posts = results[0].paginatedResults;
    const totalCount = results[0].totalCount[0]
      ? results[0].totalCount[0].count
      : 0;
    const totalPages = Math.ceil(totalCount / limit);

    return {
      posts: JSON.parse(JSON.stringify(posts)),
      pagination: {
        totalCount,
        totalPages,
      },
    };
  } catch (error) {
    console.error("[data/news] Error fetching news:", error);
    return { posts: [], pagination: { totalCount: 0, totalPages: 0 } };
  }
}
