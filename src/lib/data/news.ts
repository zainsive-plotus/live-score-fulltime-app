// ===== src/lib/data/news.ts (Corrected with a working Aggregation) =====

import "server-only";
import dbConnect from "@/lib/dbConnect";
import Post, { IPost, SportsCategory } from "@/models/Post";

const DEFAULT_LOCALE = "tr";

interface GetNewsParams {
  locale: string;
  sportsCategory?: SportsCategory;
  excludeSportsCategory?: SportsCategory;
}

/**
 * Fetches and curates published news using a robust MongoDB aggregation pipeline.
 * This is highly efficient as it performs the language fallback logic directly in the database.
 * It correctly handles both groups of translated articles and single, untranslated articles.
 * @param params - The parameters for fetching news, including locale and category filters.
 * @returns A promise that resolves to an array of IPost objects, curated for the locale.
 */
export async function getNews(params: GetNewsParams): Promise<IPost[]> {
  const { locale, sportsCategory, excludeSportsCategory } = params;

  try {
    await dbConnect();

    // 1. Initial Filtering Stage: Get all relevant posts.
    const matchStage: any = { status: "published" };
    if (sportsCategory) {
      matchStage.sportsCategory = { $in: [sportsCategory] };
    }
    if (excludeSportsCategory) {
      matchStage.sportsCategory = { $nin: [excludeSportsCategory] };
    }

    const pipeline = [
      { $match: matchStage },
      // 2. Create an 'effectiveGroupId' to handle both translated and single posts.
      // This is the key fix: Use translationGroupId if it exists, otherwise fallback to the post's own _id.
      {
        $addFields: {
          effectiveGroupId: { $ifNull: ["$translationGroupId", "$_id"] },
        },
      },
      // 3. Add a priority field for sorting based on language preference.
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
      // 4. Sort by our new effective group ID, then by our language priority.
      // This brings the "best" language version to the top of each group.
      {
        $sort: {
          effectiveGroupId: 1,
          langPriority: 1,
        },
      },
      // 5. Group by the effectiveGroupId and pick the FIRST document (which is now the best one).
      {
        $group: {
          _id: "$effectiveGroupId",
          document: { $first: "$$ROOT" },
        },
      },
      // 6. Reshape the output to be a flat list of documents.
      {
        $replaceRoot: {
          newRoot: "$document",
        },
      },
      // 7. Final sort by creation date for the entire curated list.
      {
        $sort: {
          createdAt: -1,
        },
      },
    ];

    const curatedNews = await Post.aggregate(pipeline);

    // The result from aggregate needs to be serialized for the client.
    return JSON.parse(JSON.stringify(curatedNews));
  } catch (error) {
    console.error("[getNews with Aggregation] Failed to fetch news:", error);
    return []; // Guarantee an empty array on any error.
  }
}
