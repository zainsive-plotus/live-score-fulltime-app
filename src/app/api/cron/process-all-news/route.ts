// ===== src/app/api/cron/process-all-news/route.ts =====

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

  try {
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        const sendEvent = (log: string, eventType: string = "LOG") => {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ event: eventType, data: log })}\n\n`)
          );
        };

        try {
          await dbConnect();
          const articlesToProcess = await ExternalNewsArticle.find({
            status: "fetched",
          }).sort({ pubDate: -1 });

          if (articlesToProcess.length === 0) {
            sendEvent("No new articles in the queue to process.", "COMPLETE");
            controller.close();
            return;
          }

          sendEvent(`Starting batch process for ${articlesToProcess.length} articles...`);

          let successCount = 0;
          let failureCount = 0;

          for (let i = 0; i < articlesToProcess.length; i++) {
            const article = articlesToProcess[i];
            sendEvent(`[${i + 1}/${articlesToProcess.length}] Processing: "${article.title}"`);
            
            const result = await processSingleArticle(article);

            if (result.success) {
              successCount++;
              sendEvent(`✓ Success: "${article.title}" processed.`);
            } else {
              failureCount++;
              sendEvent(`✗ Failed: "${article.title}". See server logs for details.`);
            }
          }

          sendEvent(`Batch complete. Processed: ${successCount}, Failed: ${failureCount}.`, "COMPLETE");

        } catch (error: any) {
          console.error("[API/process-all-news] Critical stream error:", error);
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
    console.error("[API/process-all-news] Initial request error:", error.message);
    return NextResponse.json(
      { error: "An unexpected server error occurred." },
      { status: 500 }
    );
  }
}