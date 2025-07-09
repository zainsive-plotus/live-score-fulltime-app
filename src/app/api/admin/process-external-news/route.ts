// src/app/api/admin/process-external-news/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/dbConnect";
import ExternalNewsArticle from "@/models/ExternalNewsArticle";
import { processSingleArticle } from "@/lib/ai-processing"; // Import our reusable function

// This endpoint is still used by the "Process with AI" button in the admin panel.
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const {
      articleId,
      journalistId,
    }: { articleId: string; journalistId?: string } = await request.json();

    if (!articleId) {
      return NextResponse.json(
        { error: "Article ID is required." },
        { status: 400 }
      );
    }

    await dbConnect();

    const externalArticle = await ExternalNewsArticle.findOne({ articleId });

    if (!externalArticle) {
      return NextResponse.json(
        { error: "External news article not found." },
        { status: 404 }
      );
    }

    // --- REFACTORED LOGIC ---
    // Instead of having all the logic here, we just call our clean, reusable function.
    const success = await processSingleArticle(externalArticle, journalistId);

    if (success) {
      // Find the newly created post to return its slug, which is useful for the UI.
      const updatedArticle = await ExternalNewsArticle.findById(
        externalArticle._id
      ).populate("processedPostId");
      return NextResponse.json(
        {
          message: "Article processed and new post created successfully.",
          postId: updatedArticle?.processedPostId?._id,
          postSlug: (updatedArticle?.processedPostId as any)?.slug,
        },
        { status: 201 }
      );
    } else {
      return NextResponse.json(
        {
          error:
            "Failed to process the article. Check server logs for details.",
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("[API/process-external-news] Critical error:", error);
    return NextResponse.json(
      { error: "An unexpected server error occurred." },
      { status: 500 }
    );
  }
}
