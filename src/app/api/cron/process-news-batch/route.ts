// src/app/api/cron/process-news-batch/route.ts
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import dbConnect from "@/lib/dbConnect";
import ExternalNewsArticle from "@/models/ExternalNewsArticle";
// Import our single, powerful processing function
import { processSingleArticle } from "@/lib/ai-processing";

const BATCH_SIZE = 5;

export async function GET(request: Request) {
  // --- Security Check ---
  const headersList = headers();
  const authHeader = headersList.get("authorization");

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    console.warn("[CRON] Unauthorized attempt to process news batch.");
    return new Response("Unauthorized", { status: 401 });
  }

  console.log(
    "[CRON] Authorized request received. Starting news processing batch."
  );

  try {
    await dbConnect();

    // Find a batch of articles ready for processing.
    const articlesToProcess = await ExternalNewsArticle.find({
      status: "fetched",
    })
      .sort({ pubDate: -1 }) // Prioritize the newest articles
      .limit(BATCH_SIZE);

    if (articlesToProcess.length === 0) {
      console.log("[CRON] No new articles to process.");
      return NextResponse.json({ message: "No new articles to process." });
    }

    console.log(
      `[CRON] Found ${articlesToProcess.length} articles to process.`
    );
    let successCount = 0;
    let failureCount = 0;

    // Process each article sequentially to avoid overwhelming the AI API.
    for (const article of articlesToProcess) {
      // The entire complex logic is now in a single, clean function call.
      const result = await processSingleArticle(article);

      if (result.success) {
        successCount++;
      } else {
        failureCount++;
      }
    }

    const report = {
      message: "CRON job completed.",
      processed: successCount,
      failed: failureCount,
      total: articlesToProcess.length,
    };

    console.log("[CRON] Batch processing complete.", report);
    return NextResponse.json(report);
  } catch (error: any) {
    console.error(
      "[CRON] A critical error occurred during the batch processing job:",
      error
    );
    return NextResponse.json(
      { error: "Internal Server Error during CRON job." },
      { status: 500 }
    );
  }
}
