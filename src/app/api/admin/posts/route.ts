// ===== src/app/api/admin/posts/route.ts =====

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/dbConnect";
import Post, { NewsType } from "@/models/Post";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    await dbConnect();
    
    // --- Start of Change ---
    const { searchParams } = new URL(request.url);
    const newsType = searchParams.get("newsType") as NewsType | null;

    const query: { newsType?: NewsType } = {};

    if (newsType) {
      query.newsType = newsType;
    }
    // --- End of Change ---

    // The query object is passed to the find method
    const posts = await Post.find(query).sort({ createdAt: -1 }).lean();

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