// ===== src/app/api/admin/seo-overrides/delete/route.ts =====

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
    const { entityType, entityId, language } = await request.json();

    if (!entityType || !entityId) {
      return NextResponse.json(
        { error: "entityType and entityId are required." },
        { status: 400 }
      );
    }

    await dbConnect();
    const cacheKey = getCacheKey(entityType, entityId);

    if (language) {
      // --- Logic to delete a SINGLE language translation ---

      // 1. Delete from MongoDB
      const dbResult = await SeoOverride.deleteOne({
        entityType,
        entityId,
        language,
      });

      // 2. Delete the specific language field from the Redis hash
      await redis.hdel(cacheKey, language);

      if (dbResult.deletedCount === 0) {
        return NextResponse.json({
          message: "No specific translation found to delete.",
        });
      }
      return NextResponse.json({
        message: `Translation for ${language.toUpperCase()} deleted successfully.`,
      });
    } else {
      // --- Logic to delete ALL translations for an entity ---

      // 1. Delete all matching documents from MongoDB
      const dbResult = await SeoOverride.deleteMany({ entityType, entityId });

      // 2. Delete the entire Redis hash for this entity
      await redis.del(cacheKey);

      if (dbResult.deletedCount === 0) {
        return NextResponse.json({
          message: "No overrides found to delete for this entity.",
        });
      }
      return NextResponse.json({
        message: `All ${dbResult.deletedCount} language overrides for the entity have been deleted.`,
      });
    }
  } catch (error) {
    console.error("[API/admin/seo-overrides/delete] POST Error:", error);
    return NextResponse.json(
      { error: "Server error deleting SEO override(s)." },
      { status: 500 }
    );
  }
}
