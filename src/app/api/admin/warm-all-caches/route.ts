import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getAllUrlsFromSitemaps } from "@/lib/sitemap-parser";
import redis from "@/lib/redis"; // <-- Import redis

const BATCH_SIZE = 10; // How many pages to fetch concurrently
const BATCH_DELAY_MS = 1000; // 1-second delay between batches to avoid overwhelming the server

/**
 * This function runs in the background and is not awaited by the POST handler.
 * It fetches all URLs and "visits" them to trigger static generation.
 */
async function initiateCacheWarming() {
  console.log("[Cache Warmer] Process started in background.");
  try {
    const urls = await getAllUrlsFromSitemaps();
    if (urls.length === 0) {
      console.log(
        "[Cache Warmer] No URLs found in sitemaps. Process finished."
      );
      return;
    }

    console.log(`[Cache Warmer] Found ${urls.length} URLs to warm up.`);

    let successCount = 0;
    let failureCount = 0;
    const totalBatches = Math.ceil(urls.length / BATCH_SIZE);

    for (let i = 0; i < urls.length; i += BATCH_SIZE) {
      const batch = urls.slice(i, i + BATCH_SIZE);
      const batchNumber = i / BATCH_SIZE + 1;
      console.log(
        `[Cache Warmer] Processing batch ${batchNumber} of ${totalBatches}...`
      );

      const promises = batch.map((url) =>
        fetch(url, { headers: { "User-Agent": "FanskorCacheWarmer/1.0" } })
          .then((res) => {
            if (res.ok) {
              successCount++;
            } else {
              failureCount++;
              console.warn(
                `[Cache Warmer] Failed to warm ${url}. Status: ${res.status}`
              );
            }
          })
          .catch((err) => {
            failureCount++;
            console.error(`[Cache Warmer] Error fetching ${url}:`, err.message);
          })
      );

      await Promise.all(promises);

      if (i + BATCH_SIZE < urls.length) {
        await new Promise((resolve) => setTimeout(resolve, BATCH_DELAY_MS));
      }
    }

    console.log(
      `[Cache Warmer] Process finished. Success: ${successCount}, Failed: ${failureCount}.`
    );
  } catch (error) {
    console.error(
      "[Cache Warmer] A critical error occurred during the background process:",
      error
    );
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // ==================== TEMPORARY CACHE CLEARING LOGIC ====================
  // This will run ONCE when you trigger the warmer. After it runs successfully,
  // you can remove this block.
  try {
    console.log("[Cache Warmer] Attempting to clear old i18n cache keys...");
    const keys = await redis.keys("i18n:*");
    if (keys.length > 0) {
      await redis.del(keys);
      console.log(
        `[Cache Warmer] Successfully deleted ${keys.length} stale i18n cache keys.`
      );
    } else {
      console.log("[Cache Warmer] No stale i18n cache keys found to delete.");
    }
  } catch (error) {
    console.error(
      "[Cache Warmer] CRITICAL: Failed to clear Redis cache. The process may fail.",
      error
    );
  }
  // ========================================================================

  // Fire-and-forget
  initiateCacheWarming();

  return NextResponse.json(
    {
      status: "pending",
      message: `Cache warming process initiated for all sitemap URLs. This will run in the background and may take several minutes. Check server logs for progress.`,
    },
    { status: 202 }
  );
}
