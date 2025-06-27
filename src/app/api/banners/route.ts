// src/app/api/banners/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/dbConnect";
import Banner, { IBanner } from "@/models/Banner";

// GET handler remains the same...
export async function GET(request: Request) {
  // ... no changes here
  const { searchParams } = new URL(request.url);
  const activeOnly = searchParams.get("active") === "true";
  const location = searchParams.get("location");

  const query: { isActive?: boolean; location?: string } = {};
  if (activeOnly) {
    query.isActive = true;
  }
  if (location) {
    query.location = location;
  }

  try {
    await dbConnect();
    const banners = await Banner.find(query).sort({ createdAt: -1 });
    return NextResponse.json(banners);
  } catch (error) {
    console.error("Failed to fetch banners:", error);
    return NextResponse.json(
      { error: "Server error fetching banners" },
      { status: 500 }
    );
  }
}

// --- POST a New Banner ---
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body: Partial<IBanner> = await request.json();

    console.log(
      "[API/Banners] Received POST request with body:",
      JSON.stringify(body, null, 2)
    );

    const { title, imageUrl, linkUrl, isActive, location } = body;

    if (!title || !imageUrl || !linkUrl || !location) {
      console.error(
        "[API/Banners] Validation failed. Missing required fields."
      );
      return NextResponse.json(
        { error: "Title, Image URL, Link URL, and Location are required" },
        { status: 400 }
      );
    }

    await dbConnect();

    // Mongoose will now correctly use the schema that includes 'location'
    const newBanner = new Banner({
      title,
      imageUrl,
      linkUrl,
      isActive,
      location,
    });

    await newBanner.save(); // This would throw an error if location was missing and the schema was loaded correctly
    console.log("[API/Banners] New banner created successfully:", newBanner);
    return NextResponse.json(newBanner, { status: 201 });
  } catch (error: any) {
    console.error("[API/Banners] Failed to create banner:", error.message);
    return NextResponse.json(
      { error: "Server error creating banner" },
      { status: 500 }
    );
  }
}
