// ===== src/lib/server-utils.ts =====

import "server-only";
import redis from "./redis";

const CACHE_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

/**
 * A server-side utility to proactively cache images found in API data.
 * It checks Redis for each URL and only fetches/caches images that are missing.
 * @param imageUrls - An array of image URLs to ensure are cached.
 */
export async function ensureImagesCached(imageUrls: string[]): Promise<void> {
  if (!imageUrls || imageUrls.length === 0) {
    return;
  }

  // Deduplicate URLs to avoid redundant checks
  const uniqueUrls = [...new Set(imageUrls)];
  const keysToFind = uniqueUrls.map(url => `image:${url}`);
  
  if (keysToFind.length === 0) {
      return;
  }

  try {
    // Check which images already exist in the cache in one go
    const existingKeys = await redis.mget(keysToFind);
    const missingUrls: string[] = [];

    existingKeys.forEach((result, index) => {
      if (!result) {
        missingUrls.push(uniqueUrls[index]);
      }
    });

    if (missingUrls.length === 0) {
      console.log(`[Cache Warmer] All ${uniqueUrls.length} images are already cached.`);
      return;
    }

    console.log(`[Cache Warmer] Caching ${missingUrls.length} new images...`);

    // Fetch and cache all missing images in parallel
    await Promise.allSettled(
      missingUrls.map(async (url) => {
        try {
          const response = await fetch(url, {
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
            },
          });

          if (!response.ok) {
            throw new Error(`Upstream fetch failed with status ${response.status}`);
          }

          const imageBuffer = Buffer.from(await response.arrayBuffer());
          const contentType = response.headers.get("content-type") || "image/png";
          const cacheKey = `image:${url}`;

          const pipeline = redis.pipeline();
          pipeline.hset(cacheKey, {
            buffer: imageBuffer.toString('binary'),
            contentType: contentType,
          });
          pipeline.expire(cacheKey, CACHE_TTL_SECONDS);
          await pipeline.exec();
        } catch (error: any) {
          console.error(`[Cache Warmer] Failed to cache image ${url}:`, error.message);
        }
      })
    );

  } catch (error) {
    console.error('[Cache Warmer] A critical error occurred:', error);
  }
}