// ===== src/app/api/social-links/route.ts =====

import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import SocialLink from "@/models/SocialLink";
import redis from "@/lib/redis";
import { SOCIAL_LINKS_CACHE_KEY } from "../admin/social-links/route"; // Import the cache key for consistency

const CACHE_TTL_SECONDS = 60 * 60 * 24; // 24 hours

export async function GET(request: Request) {
  try {
    // 1. Attempt to fetch the data from the Redis cache first.
    const cachedLinks = await redis.get(SOCIAL_LINKS_CACHE_KEY);

    if (cachedLinks) {
      // If cache hit, parse and return the data immediately.
      return NextResponse.json(JSON.parse(cachedLinks as string));
    }

    // 2. If cache miss, fetch from the database.
    console.log("[API/social-links] Cache miss. Fetching from database...");
    await dbConnect();

    const activeLinks = await SocialLink.find({ isActive: true })
      .sort({ order: 1 })
      .lean();

    // 3. Populate the cache for subsequent requests before returning the data.
    if (activeLinks.length > 0) {
      await redis.set(
        SOCIAL_LINKS_CACHE_KEY,
        JSON.stringify(activeLinks),
        "EX",
        CACHE_TTL_SECONDS
      );
    }

    return NextResponse.json(activeLinks);
  } catch (error) {
    console.error("[API/social-links] GET Error:", error);
    // In case of an error, return an empty array to prevent the site from crashing.
    return NextResponse.json([], { status: 500 });
  }
}
