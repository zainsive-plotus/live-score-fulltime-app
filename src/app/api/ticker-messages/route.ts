// ===== src/app/api/ticker-messages/route.ts =====

import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import TickerMessage from "@/models/TickerMessage";
import redis from "@/lib/redis";

const CACHE_TTL_SECONDS = 60 * 5; // 5 minutes
const DEFAULT_LOCALE = "tr";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const locale = searchParams.get("locale") || DEFAULT_LOCALE;

    const cacheKey = `ticker-messages:active:${locale}`;

    const cachedData = await redis.get(cacheKey);
    if (cachedData) {
      return NextResponse.json(JSON.parse(cachedData));
    }

    await dbConnect();
    const messages = await TickerMessage.find({
      isActive: true,
      language: locale, // <-- Filter by language
    }).sort({
      order: 1,
      createdAt: -1,
    });

    await redis.set(
      cacheKey,
      JSON.stringify(messages),
      "EX",
      CACHE_TTL_SECONDS
    );

    return NextResponse.json(messages);
  } catch (error) {
    console.error("[API/ticker-messages] Error fetching messages:", error);
    return NextResponse.json(
      { error: "Server error fetching ticker messages" },
      { status: 500 }
    );
  }
}