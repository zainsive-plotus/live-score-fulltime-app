// src/app/api/admin/external-news/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/dbConnect";
import ExternalNewsArticle from "@/models/ExternalNewsArticle";

// This handler will provide the list of saved external articles to the admin UI.
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = parseInt(searchParams.get("skip") || "0");
    const status = searchParams.get("status");

    // Build the query object for filtering
    const query: { status?: string } = {};
    if (status) {
      query.status = status;
    }

    // Fetch articles and total count in parallel for efficiency
    const [articles, totalCount] = await Promise.all([
      ExternalNewsArticle.find(query)
        .sort({ pubDate: -1 }) // Show newest first
        .skip(skip)
        .limit(limit)
        .lean(),
      ExternalNewsArticle.countDocuments(query),
    ]);

    // Return the data in the format the frontend expects
    return NextResponse.json({
      articles,
      totalCount,
      currentPage: Math.floor(skip / limit) + 1,
      perPage: limit,
    });
  } catch (error: any) {
    console.error("[API/admin/external-news] Error fetching articles:", error);
    return NextResponse.json(
      { error: "Server error fetching external news articles." },
      { status: 500 }
    );
  }
}

// Optional: You can also add the DELETE handler here if you want to consolidate.
// This is good practice.
export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const articleId = searchParams.get("articleId");

    if (!articleId) {
      return NextResponse.json(
        { error: "Article ID is required." },
        { status: 400 }
      );
    }

    await dbConnect();

    const deletedArticle = await ExternalNewsArticle.findOneAndDelete({
      articleId,
    });

    if (!deletedArticle) {
      return NextResponse.json(
        { error: "Article not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Article deleted successfully." });
  } catch (error: any) {
    console.error("[API/admin/external-news] Error deleting article:", error);
    return NextResponse.json(
      { error: "Server error deleting article." },
      { status: 500 }
    );
  }
}
