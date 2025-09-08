// ===== src/app/api/admin/social-links/[id]/route.ts =====

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/dbConnect";
import SocialLink, { ISocialLink } from "@/models/SocialLink";
import { refreshSocialLinksCache } from "../route"; // Import the cache utility

interface Params {
  params: { id: string };
}

// PUT handler to update an existing link
export async function PUT(request: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = params;
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

    const updatedLink = await SocialLink.findByIdAndUpdate(
      id,
      { platform, url, order, isActive },
      { new: true, runValidators: true }
    );

    if (!updatedLink) {
      return NextResponse.json(
        { error: "Social link not found." },
        { status: 404 }
      );
    }

    // Refresh the Redis cache after the update
    await refreshSocialLinksCache();

    return NextResponse.json(updatedLink, { status: 200 });
  } catch (error: any) {
    console.error(`[API/admin/social-links] PUT Error for ID ${id}:`, error);
    if (error.code === 11000) {
      return NextResponse.json(
        { error: "A link for this platform already exists." },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Server error updating social link." },
      { status: 500 }
    );
  }
}

// DELETE handler to remove a link
export async function DELETE(request: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = params;
  try {
    await dbConnect();
    const deletedLink = await SocialLink.findByIdAndDelete(id);

    if (!deletedLink) {
      return NextResponse.json(
        { error: "Social link not found." },
        { status: 404 }
      );
    }

    // Refresh the Redis cache after the deletion
    await refreshSocialLinksCache();

    return NextResponse.json(
      { message: "Social link deleted successfully." },
      { status: 200 }
    );
  } catch (error) {
    console.error(`[API/admin/social-links] DELETE Error for ID ${id}:`, error);
    return NextResponse.json(
      { error: "Server error deleting social link." },
      { status: 500 }
    );
  }
}
