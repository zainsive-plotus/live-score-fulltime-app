// ===== src/app/api/admin/referrer-rules/route.ts =====

import { NextResponse, NextRequest } from "next/server";
import dbConnect from "@/lib/dbConnect";
import ReferrerRule, { IReferrerRule } from "@/models/ReferrerRule";
import redis from "@/lib/redis";

export const REFERRER_RULES_CACHE_KEY = "referrer-rules:active-list";

/**
 * Refreshes the Redis cache with the current list of active referrer URLs.
 * This should be called after any create, update, or delete operation.
 */
export async function refreshReferrerCache() {
  try {
    await dbConnect();
    const activeRules = await ReferrerRule.find({ isActive: true })
      .select("sourceUrl")
      .lean();
    const sourceUrls = activeRules.map((rule) => rule.sourceUrl);

    if (sourceUrls.length > 0) {
      await redis.set(REFERRER_RULES_CACHE_KEY, JSON.stringify(sourceUrls));
    } else {
      await redis.del(REFERRER_RULES_CACHE_KEY);
    }
    console.log(
      `[Referrer Tracker] Cache refreshed with ${sourceUrls.length} active rules.`
    );
  } catch (error) {
    console.error("[Referrer Tracker] Failed to refresh cache:", error);
  }
}

/**
 * GET handler to fetch a paginated list of all referrer rules for the admin panel.
 */
const getHandler = async (request: NextRequest) => {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = 15; // Set a fixed limit for the admin panel
    const skip = (page - 1) * limit;

    const [rules, totalCount] = await Promise.all([
      ReferrerRule.find({})
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      ReferrerRule.countDocuments({}),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      rules,
      pagination: { currentPage: page, totalPages, totalCount },
    });
  } catch (error) {
    console.error("[API/admin/referrer-rules] GET Error:", error);
    return NextResponse.json(
      { error: "Server error fetching referrer rules." },
      { status: 500 }
    );
  }
};

/**
 * POST handler to create a new referrer rule.
 */
const postHandler = async (request: NextRequest) => {
  try {
    const body: Partial<IReferrerRule> = await request.json();
    const { sourceUrl, description, isActive } = body;

    if (!sourceUrl || !description) {
      return NextResponse.json(
        { error: "Source URL and Description are required." },
        { status: 400 }
      );
    }

    await dbConnect();

    const newRule = new ReferrerRule({
      sourceUrl,
      description,
      isActive: isActive !== undefined ? isActive : true,
    });

    await newRule.save();
    await refreshReferrerCache();

    return NextResponse.json(newRule, { status: 201 });
  } catch (error: any) {
    if (error.code === 11000) {
      return NextResponse.json(
        { error: "A rule for this Source URL already exists." },
        { status: 409 }
      );
    }
    console.error("[API/admin/referrer-rules] POST Error:", error);
    return NextResponse.json(
      { error: "Server error creating referrer rule." },
      { status: 500 }
    );
  }
};

// Secure and export the handlers
export const GET = getHandler;
export const POST = postHandler;
