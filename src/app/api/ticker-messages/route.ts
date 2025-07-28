// ===== src/app/api/ticker-messages/route.ts =====

import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import TickerMessage, { ITickerMessage } from "@/models/TickerMessage";
import Post from "@/models/Post"; // Import the Post model
import redis from "@/lib/redis";

const CACHE_TTL_SECONDS = 60 * 5; // 5 minutes
const DEFAULT_LOCALE = "tr";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const locale = searchParams.get("locale") || DEFAULT_LOCALE;

    const cacheKey = `ticker-messages:active:${locale}`;

    // 1. Check cache first
    const cachedData = await redis.get(cacheKey);
    if (cachedData) {
      return NextResponse.json(JSON.parse(cachedData));
    }

    await dbConnect();

    // 2. Try to get custom ticker messages from the database
    const customMessages = await TickerMessage.find({
      isActive: true,
      language: locale,
    }).sort({
      order: 1,
      createdAt: -1,
    }).lean();

    // 3. If custom messages exist, use them
    if (customMessages && customMessages.length > 0) {
      await redis.set(
        cacheKey,
        JSON.stringify(customMessages),
        "EX",
        CACHE_TTL_SECONDS
      );
      return NextResponse.json(customMessages);
    }

    // 4. If no custom messages, fetch recent news titles as a fallback
    console.log(`[Ticker API] No custom messages for locale '${locale}'. Fetching news fallback.`);
    
    const recentNews = await Post.find({
      status: "published",
      language: locale,
      sportsCategory: { $in: ["general"] },
    })
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();

    // --- Start of Change ---
    // Transform news data into the format expected by the Ticker, now including the link (href)
    const newsAsTickerMessages = recentNews.map((post, index) => ({
      _id: post._id,
      message: post.title,
      language: post.language,
      isActive: true,
      order: index,
      // Add the link to the news article
      href: `/news/${post.slug}`, 
    }));
    // --- End of Change ---

    // Cache the fallback news data
    if (newsAsTickerMessages.length > 0) {
        await redis.set(
            cacheKey,
            JSON.stringify(newsAsTickerMessages),
            "EX",
            CACHE_TTL_SECONDS
        );
    }

    return NextResponse.json(newsAsTickerMessages);

  } catch (error) {
    console.error("[API/ticker-messages] Error fetching ticker messages:", error);
    return NextResponse.json(
      { error: "Server error fetching ticker messages" },
      { status: 500 }
    );
  }
}