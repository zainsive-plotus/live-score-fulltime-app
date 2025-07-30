// ===== src/app/api/admin/process-external-news/route.ts =====

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/dbConnect";
import ExternalNewsArticle from "@/models/ExternalNewsArticle";
import { processSingleArticle } from "@/lib/ai-processing";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  // --- Start of Fix ---
  // The 'articleId' from the client is the unique string from the news provider, not the MongoDB _id.
  const { articleId } = body; 
  
  if (!articleId) {
    return NextResponse.json(
      { error: "External Article ID is required." },
      { status: 400 }
    );
  }
  // --- End of Fix ---

  try {
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        const sendEvent = (log: string, eventType: string = "LOG") => {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ event: eventType, data: log, log })}\n\n`)
          );
        };

        try {
          await dbConnect();
          // --- Start of Fix ---
          // Use `findOne({ articleId: ... })` to search by the provider's string ID,
          // instead of `findById()`, which expects a MongoDB ObjectId.
          const articleToProcess = await ExternalNewsArticle.findOne({ articleId: articleId });
          // --- End of Fix ---

          if (!articleToProcess) {
            throw new Error(`External news article with ID '${articleId}' not found in the database.`);
          }

          const result = await processSingleArticle(articleToProcess, {
            onProgress: (log: string) => sendEvent(log),
          });

          if (result.success) {
            sendEvent("Article and translations created successfully.", "SUCCESS");
          } else {
            throw new Error("Article processing failed. Check server logs for details.");
          }

        } catch (error: any) {
          console.error("[API/process-external-news] Stream error:", error);
          sendEvent(`A critical error occurred: ${error.message}`, "ERROR");
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
    console.error("[API/process-external-news] Initial request error:", error.message);
    return NextResponse.json(
      { error: "An unexpected server error occurred." },
      { status: 500 }
    );
  }
}