// ===== src/app/api/cron/process-news-batch/route.ts =====

import { NextResponse } from "next/server";
import { headers } from "next/headers";
import dbConnect from "@/lib/dbConnect";
import ExternalNewsArticle from "@/models/ExternalNewsArticle";
import { processSingleArticle } from "@/lib/ai-processing";

// --- Start of Change ---
// We'll process one article group at a time to stay within serverless function time limits.
// The automation will trigger this CRON job frequently (e.g., every 5-10 minutes).
const BATCH_SIZE = 1;
// --- End of Change ---

export async function GET(request: Request) {
  const headersList = headers();
  const authHeader = headersList.get("authorization");

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  console.log(
    "[CRON] Authorized request received. Starting automated news processing."
  );

  try {
    await dbConnect();

    // Find the next available article to process.
    const articlesToProcess = await ExternalNewsArticle.find({
      status: "fetched",
    })
      .sort({ pubDate: -1 }) // Prioritize the most recent news
      .limit(BATCH_SIZE);

    if (articlesToProcess.length === 0) {
      console.log("[CRON] No new articles to process.");
      return NextResponse.json({ message: "No new articles to process." });
    }

    console.log(
      `[CRON] Found ${articlesToProcess.length} article(s) to process.`
    );
    let successCount = 0;
    let failureCount = 0;
    
    // --- Start of Change ---
    // The loop now calls our enhanced, fully-automated processing function.
    for (const article of articlesToProcess) {
      console.log(`[CRON] Processing article: ${article.title}`);
      const result = await processSingleArticle(article);
      if (result.success) {
        successCount++;
        console.log(`[CRON] Successfully processed article ID: ${article.articleId}`);
      } else {
        failureCount++;
        console.error(`[CRON] Failed to process article ID: ${article.articleId}`);
      }
    }
    // --- End of Change ---

    const report = {
      message: "CRON job completed.",
      processed: successCount,
      failed: failureCount,
      total: articlesToProcess.length,
    };
    
    console.log("[CRON] Batch finished.", report);
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