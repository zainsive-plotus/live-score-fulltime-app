// ===== src/app/api/admin/posts/route.ts =====

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/dbConnect";
import Post from "@/models/Post";

// This is a dedicated endpoint for the admin panel.
// It fetches ALL posts without the curation/language fallback logic.

export async function GET(request: Request) {
  // 1. Admin-only check
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    await dbConnect();

    // 2. Fetch ALL posts, sorted by creation date. This is what the admin panel needs.
    const posts = await Post.find({}).sort({ createdAt: -1 }).lean();

    return NextResponse.json(posts);
  } catch (error) {
    console.error(
      "[API/admin/posts GET] Server error fetching posts for admin:",
      error
    );
    return NextResponse.json(
      { error: "Server error fetching posts" },
      { status: 500 }
    );
  }
}
