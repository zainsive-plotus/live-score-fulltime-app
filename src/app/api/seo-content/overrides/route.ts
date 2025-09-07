// ===== src/app/api/seo-content/overrides/route.ts =====

import { NextResponse } from "next/server";
import redis from "@/lib/redis";

const getCacheKey = (entityType: string, entityId: string) =>
  `seo-override:${entityType}:${entityId}`;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get("entityType");
    const entityId = searchParams.get("entityId");
    const language = searchParams.get("language");

    if (!entityType || !entityId || !language) {
      return NextResponse.json(
        { error: "entityType, entityId, and language are required." },
        { status: 400 }
      );
    }

    const cacheKey = getCacheKey(entityType, entityId);

    // This endpoint ONLY reads from Redis for maximum performance.
    // It does not have a database fallback.
    const cachedData = await redis.hget(cacheKey, language);

    if (!cachedData) {
      // Return 404 if no override is found in the cache for this language.
      return NextResponse.json(
        { error: "SEO override not found." },
        { status: 404 }
      );
    }

    // The data is stored as a stringified JSON, so we parse it before sending.
    return NextResponse.json(JSON.parse(cachedData as string));
  } catch (error) {
    console.error("[API/seo-content/overrides] GET Error:", error);
    // Return a generic error but with a 404 status to avoid breaking the page
    // if Redis is down or another critical error occurs.
    return NextResponse.json(
      { error: "Could not retrieve SEO content." },
      { status: 404 }
    );
  }
}
