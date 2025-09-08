// ===== src/app/api/admin/social-links/route.ts =====

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/dbConnect";
import SocialLink, { ISocialLink } from "@/models/SocialLink";
import redis from "@/lib/redis";

// Define a constant for our Redis cache key to avoid typos
export const SOCIAL_LINKS_CACHE_KEY = "social-links:active-v1";

// This utility function will be called by all write operations (POST, PUT, DELETE)
// to ensure the public-facing cache is always up-to-date.
export async function refreshSocialLinksCache() {
  console.log("[Social Links] Refreshing Redis cache...");
  try {
    await dbConnect();

    const activeLinks = await SocialLink.find({ isActive: true })
      .sort({ order: 1 }) // Sort by the specified order
      .lean();

    if (activeLinks.length > 0) {
      // Cache the data for 1 week (a long time, since it's only updated by admin actions)
      await redis.set(
        SOCIAL_LINKS_CACHE_KEY,
        JSON.stringify(activeLinks),
        "EX",
        604800
      );
    } else {
      // If there are no active links, ensure the cache is empty
      await redis.del(SOCIAL_LINKS_CACHE_KEY);
    }

    console.log(
      `[Social Links] Cache refreshed with ${activeLinks.length} active links.`
    );
  } catch (error) {
    console.error("[Social Links] Failed to refresh Redis cache:", error);
  }
}

// GET handler to fetch all links (active and inactive) for the admin panel
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    await dbConnect();

    // Admin needs to see all links to manage them, so no `isActive` filter here
    const links = await SocialLink.find({}).sort({ order: 1 }).lean();

    return NextResponse.json(links);
  } catch (error) {
    console.error("[API/admin/social-links] GET Error:", error);
    return NextResponse.json(
      { error: "Server error fetching social links." },
      { status: 500 }
    );
  }
}

// POST handler to create a new link
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body: Partial<ISocialLink> = await request.json();
    const { platform, url, order, isActive } = body;

    if (!platform || !url) {
      return NextResponse.json(
        { error: "Platform and URL are required." },
        { status: 400 }
      );
    }

    await dbConnect();

    const newLink = new SocialLink({
      platform,
      url,
      order: order || 0,
      isActive: isActive !== undefined ? isActive : true,
    });

    await newLink.save();

    // Invalidate and refresh the public cache after creating the new link
    await refreshSocialLinksCache();

    return NextResponse.json(newLink, { status: 201 });
  } catch (error: any) {
    console.error("[API/admin/social-links] POST Error:", error);
    if (error.code === 11000) {
      // Handle duplicate platform
      return NextResponse.json(
        { error: "A link for this platform already exists." },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Server error creating social link." },
      { status: 500 }
    );
  }
}
