// src/app/api/admin/external-news/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/dbConnect";
import ExternalNewsArticle from "@/models/ExternalNewsArticle";

// GET handler to retrieve external news articles for the admin dashboard
export async function GET(request: Request) {
  console.log("[API/admin/external-news] GET request received.");

  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    console.warn(
      "[API/admin/external-news] Forbidden: Non-admin user attempted GET."
    );
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  console.log("[API/admin/external-news] User is authenticated as admin.");

  try {
    await dbConnect();
    console.log("[API/admin/external-news] Database connected successfully.");

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status"); // Optional: filter by status (e.g., 'fetched', 'processed', 'skipped')
    const limit = searchParams.get("limit");
    const skip = searchParams.get("skip");

    console.log(
      `[API/admin/external-news] Parameters received: status=${status}, limit=${limit}, skip=${skip}`
    );

    const query: { status?: string } = {};
    if (status) {
      query.status = status;
    }

    let articlesQuery = ExternalNewsArticle.find(query).sort({
      pubDate: -1,
      createdAt: -1,
    }); // Sort by publish date, then creation date

    const totalCount = await ExternalNewsArticle.countDocuments(query);
    console.log(
      `[API/admin/external-news] Total articles matching query: ${totalCount}`
    );

    if (limit) {
      articlesQuery = articlesQuery.limit(parseInt(limit));
    }
    if (skip) {
      articlesQuery = articlesQuery.skip(parseInt(skip));
    }

    const articles = await articlesQuery.lean(); // Use .lean() for faster query results if no Mongoose methods are needed
    console.log(
      `[API/admin/external-news] Fetched ${articles.length} articles for display.`
    );

    return NextResponse.json(
      {
        articles,
        totalCount,
        currentPage: skip
          ? Math.floor(parseInt(skip) / (limit ? parseInt(limit) : 1)) + 1
          : 1,
        perPage: limit ? parseInt(limit) : totalCount, // Or a default if no limit provided
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[API/admin/external-news] Error in GET handler:", error); // Log full error object
    if (error.name === "MongooseError" || error.name === "MongoNetworkError") {
      console.error(
        "[API/admin/external-news] Database connection or query error:",
        error.message
      );
    }
    // Return a 500 server error response for unhandled exceptions
    return NextResponse.json(
      { error: "Server error fetching external news articles." },
      { status: 500 }
    );
  }
}

// DELETE handler to remove an external news article (if needed by admin)
export async function DELETE(request: Request) {
  console.log("[API/admin/external-news] DELETE request received.");

  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    console.warn(
      "[API/admin/external-news] Forbidden: Non-admin user attempted DELETE."
    );
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  console.log("[API/admin/external-news] User is authenticated as admin.");

  const { searchParams } = new URL(request.url);
  const articleId = searchParams.get("articleId");

  if (!articleId) {
    console.error("[API/admin/external-news] Missing Article ID for DELETE.");
    return NextResponse.json(
      { error: "Article ID is required." },
      { status: 400 }
    );
  }

  try {
    await dbConnect();
    console.log(
      "[API/admin/external-news] Database connected successfully for DELETE."
    );

    const deletedArticle = await ExternalNewsArticle.findOneAndDelete({
      articleId,
    });

    if (!deletedArticle) {
      console.warn(
        `[API/admin/external-news] External news article not found for deletion: ${articleId}`
      );
      return NextResponse.json(
        { error: "External news article not found." },
        { status: 404 }
      );
    }
    console.log(
      `[API/admin/external-news] Successfully deleted article: ${articleId}`
    );

    return NextResponse.json(
      { message: "External news article deleted successfully." },
      { status: 200 }
    );
  } catch (error: any) {
    console.error(
      "[API/admin/external-news] Error deleting external news article:",
      error.message
    );
    return NextResponse.json(
      { error: "Server error deleting external news article." },
      { status: 500 }
    );
  }
}
