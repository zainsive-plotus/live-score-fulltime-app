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
 * Fetches published news and curates the list based on the user's locale.
 * For each translation group, it prioritizes the requested locale, then falls back to the default locale.
 * This ensures a complete list is always shown.
 * @param params - The parameters for fetching news, including locale and category filters.
 * @returns A promise that resolves to an array of IPost objects, curated for the locale.
 */
export async function getNews(params: GetNewsParams): Promise<IPost[]> {
  const { locale, sportsCategory, excludeSportsCategory } = params;

  try {
    await dbConnect();

    // Build the query based on parameters
    const query: any = { status: "published" };
    if (sportsCategory) {
      query.sportsCategory = { $in: [sportsCategory] };
    }
    if (excludeSportsCategory) {
      query.sportsCategory = { $nin: [excludeSportsCategory] };
    }

    const allPosts = await Post.find(query).sort({ createdAt: -1 }).lean();

    if (!allPosts || allPosts.length === 0) {
      return [];
    }

    const groupedByTranslationId = new Map<string, IPost[]>();

    // Group all posts by their translationGroupId
    for (const post of allPosts) {
      const groupId = post.translationGroupId.toString();
      if (!groupedByTranslationId.has(groupId)) {
        groupedByTranslationId.set(groupId, []);
      }
      groupedByTranslationId.get(groupId)!.push(post);
    }

    const curatedNews: IPost[] = [];

    // For each group, select the best version for the current locale
    for (const group of groupedByTranslationId.values()) {
      const postInLocale = group.find((p) => p.language === locale);
      const postInDefaultLocale = group.find(
        (p) => p.language === DEFAULT_LOCALE
      );

      // Priority: Current Locale > Default Locale > First available
      const postToShow = postInLocale || postInDefaultLocale || group[0];

      if (postToShow) {
        curatedNews.push(postToShow);
      }
    }

    // Ensure the final list is sorted by the creation date of the selected post
    curatedNews.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // Serialize the result to ensure it's a plain object for the client
    return JSON.parse(JSON.stringify(curatedNews));
  } catch (error) {
    console.error("[getNews] Failed to fetch news:", error);
    return []; // Guarantee an empty array is returned on any error
  }
}
