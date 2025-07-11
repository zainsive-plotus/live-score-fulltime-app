// ===== src/app/api/admin/process-external-news/route.ts =====

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/dbConnect";
import ExternalNewsArticle from "@/models/ExternalNewsArticle";
import { processSingleArticle } from "@/lib/ai-processing";
import { NewsType, SportsCategory } from "@/models/Post";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    // --- FIX START: Added titleTemplateId to the destructuring ---
    const {
      articleId,
      journalistId,
      titleTemplateId, // <-- ADDED THIS LINE
      sportsCategory,
      newsType,
      status,
    }: {
      articleId: string;
      journalistId?: string;
      titleTemplateId?: string; // <-- ADDED THIS LINE
      sportsCategory: SportsCategory[];
      newsType: NewsType;
      status: "draft" | "published";
    } = await request.json();
    // --- FIX END ---

    if (
      !articleId ||
      !sportsCategory ||
      sportsCategory.length === 0 ||
      !newsType
    ) {
      return NextResponse.json(
        { error: "Missing required parameters." },
        { status: 400 }
      );
    }

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        const sendEvent = (log: string) => {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ log })}\n\n`)
          );
        };

        try {
          await dbConnect();
          const externalArticle = await ExternalNewsArticle.findOne({
            articleId,
          });

          if (!externalArticle) {
            throw new Error("External news article not found.");
          }

          // --- FIX START: Pass titleTemplateId to the processing function ---
          const result = await processSingleArticle(externalArticle, {
            journalistId,
            titleTemplateId, // <-- ADDED THIS LINE
            sportsCategory,
            newsType,
            status,
            onProgress: sendEvent,
          });
          // --- FIX END ---

          if (result.success) {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  event: "SUCCESS",
                  data: result,
                })}\n\n`
              )
            );
          } else {
            throw new Error("Article processing failed in the final step.");
          }
        } catch (error: any) {
          console.error("[Process News API Stream] Error:", error.message);
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                event: "ERROR",
                data: { message: error.message },
              })}\n\n`
            )
          );
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error: any) {
    console.error(
      "[Process News API] Initial Body Parse Error:",
      error.message
    );
    return NextResponse.json(
      { error: "An unexpected server error occurred." },
      { status: 500 }
    );
  }
}
