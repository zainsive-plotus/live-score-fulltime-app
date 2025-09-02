// ===== src/app/api/admin/tracked-links/route.ts =====

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/dbConnect";
import TrackedLink from "@/models/TrackedLink";
import { nanoid } from "nanoid";

const BASE_URL =
  process.env.NEXT_PUBLIC_PUBLIC_APP_URL || "http://localhost:3000";

// GET handler to fetch all links for the admin panel
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

    const [links, totalCount] = await Promise.all([
      TrackedLink.find({})
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      TrackedLink.countDocuments({}),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      links,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
      },
    });
  } catch (error) {
    console.error("[API/admin/tracked-links] GET Error:", error);
    return NextResponse.json(
      { error: "Server error fetching links." },
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
    const body = await request.json();
    const { originalUrl, description, utmSource, utmMedium, utmCampaign } =
      body;

    if (!originalUrl || !description) {
      return NextResponse.json(
        { error: "Original URL and Description are required." },
        { status: 400 }
      );
    }

    await dbConnect();

    // Generate a unique, 7-character short code
    // The loop is a safeguard against the extremely rare case of a collision
    let shortCode;
    let isUnique = false;
    while (!isUnique) {
      shortCode = nanoid(7);
      const existing = await TrackedLink.findOne({ shortCode });
      if (!existing) {
        isUnique = true;
      }
    }

    const newLink = new TrackedLink({
      originalUrl,
      description,
      shortCode,
      fullShortLink: `${BASE_URL}/go/${shortCode}`,
      utmSource,
      utmMedium,
      utmCampaign,
      isActive: true,
    });

    await newLink.save();

    return NextResponse.json(newLink, { status: 201 });
  } catch (error) {
    console.error("[API/admin/tracked-links] POST Error:", error);
    return NextResponse.json(
      { error: "Server error creating link." },
      { status: 500 }
    );
  }
}
