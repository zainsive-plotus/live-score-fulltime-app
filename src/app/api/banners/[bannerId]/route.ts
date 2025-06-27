// src/app/api/banners/[bannerId]/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/dbConnect";
import Banner, { IBanner } from "@/models/Banner";

interface Params {
  params: { bannerId: string };
}

// --- PUT (Update) a Banner ---
// Protected: Only admins can update.
export async function PUT(request: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { bannerId } = params;
  try {
    const body: Partial<IBanner> = await request.json();
    // --- THE FIX IS HERE ---
    // Destructure ALL fields from the body that you intend to update.
    const { title, imageUrl, linkUrl, isActive, location } = body;

    await dbConnect();

    const updatedBanner = await Banner.findByIdAndUpdate(
      bannerId,
      {
        // Pass an explicit object with all the fields to Mongoose.
        // This ensures 'location' is included in the update.
        title,
        imageUrl,
        linkUrl,
        isActive,
        location,
      },
      { new: true, runValidators: true }
    );

    if (!updatedBanner) {
      return NextResponse.json({ error: "Banner not found" }, { status: 404 });
    }

    return NextResponse.json(updatedBanner);
  } catch (error) {
    console.error("Error updating banner:", error);
    return NextResponse.json(
      { error: "Server error updating banner" },
      { status: 500 }
    );
  }
}

// --- DELETE a Banner ---
// (No changes needed for the DELETE handler)
export async function DELETE(request: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { bannerId } = params;
  try {
    await dbConnect();
    const deletedBanner = await Banner.findByIdAndDelete(bannerId);
    if (!deletedBanner) {
      return NextResponse.json({ error: "Banner not found" }, { status: 404 });
    }
    return NextResponse.json({ message: "Banner deleted successfully" });
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
