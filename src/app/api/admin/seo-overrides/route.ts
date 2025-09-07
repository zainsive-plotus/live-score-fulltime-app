// ===== src/app/api/admin/seo-overrides/route.ts =====

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/dbConnect";
import SeoOverride, { ISeoOverride } from "@/models/SeoOverride";
import redis from "@/lib/redis";

// Define a standardized cache key function to ensure consistency
const getCacheKey = (entityType: string, entityId: string) =>
  `seo-override:${entityType}:${entityId}`;

// GET handler: Fetches all language overrides for a specific entity
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get("entityType");
    const entityId = searchParams.get("entityId");

    if (!entityType || !entityId) {
      return NextResponse.json(
        { error: "entityType and entityId are required." },
        { status: 400 }
      );
    }

    const cacheKey = getCacheKey(entityType, entityId);

    // 1. Try to fetch from Redis cache first
    const cachedData = await redis.hgetall(cacheKey);
    if (cachedData && Object.keys(cachedData).length > 0) {
      // Deserialize the JSON strings back into objects
      const parsedData = Object.entries(cachedData).reduce(
        (acc, [lang, value]) => {
          acc[lang] = JSON.parse(value);
          return acc;
        },
        {} as Record<string, any>
      );
      return NextResponse.json(parsedData);
    }

    // 2. If cache miss, fetch from MongoDB
    await dbConnect();
    const overrides = await SeoOverride.find({ entityType, entityId }).lean();

    if (!overrides || overrides.length === 0) {
      return NextResponse.json({}, { status: 200 }); // Return empty object if no overrides exist
    }

    // 3. Format data for both response and caching
    const dataToCache: Record<string, string> = {};
    const responseData: Record<string, any> = {};

    overrides.forEach((doc) => {
      const langData = {
        metaTitle: doc.metaTitle,
        metaDescription: doc.metaDescription,
        seoText: doc.seoText,
      };
      dataToCache[doc.language] = JSON.stringify(langData);
      responseData[doc.language] = langData;
    });

    // 4. Populate the Redis cache for future requests
    if (Object.keys(dataToCache).length > 0) {
      await redis.hmset(cacheKey, dataToCache);
    }

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("[API/admin/seo-overrides] GET Error:", error);
    return NextResponse.json(
      { error: "Server error fetching SEO overrides." },
      { status: 500 }
    );
  }
}

// POST/PUT handler: Creates or updates a single language override for an entity
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body: Partial<ISeoOverride> = await request.json();
    const {
      entityType,
      entityId,
      language,
      metaTitle,
      metaDescription,
      seoText,
    } = body;

    if (!entityType || !entityId || !language) {
      return NextResponse.json(
        { error: "entityType, entityId, and language are required." },
        { status: 400 }
      );
    }

    await dbConnect();

    // 1. Save to MongoDB using findOneAndUpdate with upsert
    const updatedOverride = await SeoOverride.findOneAndUpdate(
      { entityType, entityId, language },
      { $set: { metaTitle, metaDescription, seoText } },
      { new: true, upsert: true, runValidators: true }
    ).lean();

    // 2. Update the Redis cache for the specific language
    const cacheKey = getCacheKey(entityType, entityId);
    const langData = JSON.stringify({
      metaTitle: updatedOverride.metaTitle,
      metaDescription: updatedOverride.metaDescription,
      seoText: updatedOverride.seoText,
    });

    await redis.hset(cacheKey, { [language]: langData });

    return NextResponse.json(updatedOverride, { status: 200 });
  } catch (error) {
    console.error("[API/admin/seo-overrides] POST Error:", error);
    return NextResponse.json(
      { error: "Server error saving SEO override." },
      { status: 500 }
    );
  }
}
