// ===== src/app/api/admin/referrer-rules/route.ts =====

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/dbConnect";
import ReferrerRule, { IReferrerRule } from "@/models/ReferrerRule";
import redis from "@/lib/redis";

// Define a constant for our Redis cache key to avoid typos
export const REFERRER_RULES_CACHE_KEY = "referrer-rules:active-list";

// This function will be called whenever rules are updated to refresh the cache.
export async function refreshReferrerCache() {
  console.log("[Referrer Tracker] Refreshing Redis cache...");
  await dbConnect();

  // Fetch only the active rules and only the sourceUrl field for maximum efficiency
  const activeRules = await ReferrerRule.find({ isActive: true })
    .select("sourceUrl")
    .lean();

  // Store the list of source URLs in Redis
  const sourceUrls = activeRules.map((rule) => rule.sourceUrl);

  if (sourceUrls.length > 0) {
    await redis.set(REFERRER_RULES_CACHE_KEY, JSON.stringify(sourceUrls));
  } else {
    // If there are no active rules, delete the key to avoid stale data
    await redis.del(REFERRER_RULES_CACHE_KEY);
  }

  console.log(
    `[Referrer Tracker] Cache refreshed with ${sourceUrls.length} active rules.`
  );
  return sourceUrls;
}

// GET handler to fetch all rules for the admin panel
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "15");
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
}

// POST handler to create a new rule
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body: Partial<IReferrerRule> = await request.json();
    const { sourceUrl, targetPage, description } = body;

    if (!sourceUrl || !targetPage || !description) {
      return NextResponse.json(
        { error: "Source URL, Target Page, and Description are required." },
        { status: 400 }
      );
    }

    await dbConnect();

    const newRule = new ReferrerRule({
      sourceUrl,
      targetPage,
      description,
      isActive: body.isActive !== undefined ? body.isActive : true,
    });

    await newRule.save();

    // Invalidate and refresh the cache after creating a new rule
    await refreshReferrerCache();

    return NextResponse.json(newRule, { status: 201 });
  } catch (error: any) {
    console.error("[API/admin/referrer-rules] POST Error:", error);
    if (error.code === 11000) {
      // Handle duplicate sourceUrl
      return NextResponse.json(
        { error: "A rule for this Source URL already exists." },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Server error creating referrer rule." },
      { status: 500 }
    );
  }
}
