// ===== src/app/api/admin/seo-overrides/cache/route.ts =====

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/dbConnect";
import SeoOverride from "@/models/SeoOverride";
import redis from "@/lib/redis";

const getCacheKey = (entityType: string, entityId: string) =>
  `seo-override:${entityType}:${entityId}`;

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    console.log(
      "[Cache Manager] Starting manual refresh of SEO Overrides cache..."
    );
    await dbConnect();

    // 1. Fetch ALL override documents from the database
    const allOverrides = await SeoOverride.find({}).lean();

    if (allOverrides.length === 0) {
      console.log(
        "[Cache Manager] No overrides found in DB. Clearing all related keys in Redis."
      );
      const keys = await redis.keys("seo-override:*");
      if (keys.length > 0) {
        await redis.del(keys);
      }
      return NextResponse.json({
        message: "No overrides found. All related cache keys cleared.",
      });
    }

    // 2. Group the documents by their cache key (i.e., by entity)
    const groupedByEntity: Record<string, Record<string, string>> = {};
    allOverrides.forEach((doc) => {
      const cacheKey = getCacheKey(doc.entityType, doc.entityId);
      if (!groupedByEntity[cacheKey]) {
        groupedByEntity[cacheKey] = {};
      }
      const langData = JSON.stringify({
        metaTitle: doc.metaTitle,
        metaDescription: doc.metaDescription,
        seoText: doc.seoText,
      });
      groupedByEntity[cacheKey][doc.language] = langData;
    });

    // 3. Clear all old cache keys to remove any stale entries
    const oldKeys = await redis.keys("seo-override:*");
    if (oldKeys.length > 0) {
      await redis.del(oldKeys);
    }

    // 4. Execute all new cache writes in a single pipeline for performance
    const pipeline = redis.pipeline();
    for (const cacheKey in groupedByEntity) {
      pipeline.hmset(cacheKey, groupedByEntity[cacheKey]);
    }
    await pipeline.exec();

    const message = `Successfully refreshed Redis cache with data for ${
      Object.keys(groupedByEntity).length
    } entities.`;
    console.log(`[Cache Manager] ${message}`);
    return NextResponse.json({ message });
  } catch (error) {
    console.error("[API/admin/seo-overrides/cache] POST Error:", error);
    return NextResponse.json(
      { error: "Server error refreshing cache." },
      { status: 500 }
    );
  }
}
