// ===== src/lib/data/news.ts =====

import "server-only";
import dbConnect from "@/lib/dbConnect";
import Post, { IPost, NewsType, SportsCategory } from "@/models/Post";

const DEFAULT_LOCALE = "tr";

interface GetNewsParams {
  locale: string;
  sportsCategory?: SportsCategory;
  newsType?: NewsType;
  page?: number;
  limit?: number;
  linkedFixtureId?: number;
}

export async function getNews(
  params: GetNewsParams
): Promise<{
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
  } = params;

  try {
    await dbConnect();

    const matchConditions: any[] = [{ status: "published" }];

    // --- Start of Fix ---
    // The value for $in must be an array. We wrap sportsCategory in square brackets.
    if (sportsCategory) {
      matchConditions.push({ sportsCategory: { $in: [sportsCategory] } });
    }
    // --- End of Fix ---

    if (newsType) {
      matchConditions.push({ newsType: newsType });
    }
    if (linkedFixtureId) {
      matchConditions.push({ linkedFixtureId: linkedFixtureId });
    }

    const matchStage = { $and: matchConditions };

    const skip = (page - 1) * limit;

    const initialPipeline = [
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
      ...initialPipeline,
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
    console.error(`[getNews Data Fetching Error]`, error);
    return { posts: [], pagination: { totalCount: 0, totalPages: 0 } };
  }
}
