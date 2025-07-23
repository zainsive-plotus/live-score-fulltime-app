// ===== src/app/api/image-proxy/route.ts (Redis Enhanced) =====

import { NextRequest, NextResponse } from "next/server";
import redis from "@/lib/redis"; // <-- 1. Import our Redis client

// Cache images for 7 days
const CACHE_TTL_SECONDS = 60 * 60 * 24 * 7;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const imageUrl = searchParams.get("url");

  if (!imageUrl) {
    return NextResponse.json(
      { error: "Image URL is required" },
      { status: 400 }
    );
  }
  
  // 2. Create a unique cache key for the image
  const cacheKey = `image:${imageUrl}`;

  try {
    // 3. Check Redis for the cached image data
    // We use hgetall to get both the buffer and the content type from the hash
    const cachedData = await redis.hgetall(cacheKey);

    if (cachedData && cachedData.buffer && cachedData.contentType) {
      console.log(`[Image Cache HIT] Serving from Redis: ${imageUrl}`);
      // Redis stores buffers as strings, so we need to convert it back
      const imageBuffer = Buffer.from(cachedData.buffer, 'binary');
      
      return new NextResponse(imageBuffer, {
        status: 200,
        headers: {
          "Content-Type": cachedData.contentType,
          "Cache-Control": "public, max-age=604800, immutable", // Tell browser to cache
          "X-Cache-Status": "HIT",
        },
      });
    }

    // 4. Cache Miss: Fetch the image from the original source
    console.log(`[Image Cache MISS] Fetching fresh image: ${imageUrl}`);
    const response = await fetch(imageUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    });

    if (!response.ok) {
      throw new Error(`Upstream fetch failed with status ${response.status}`);
    }

    const imageBuffer = Buffer.from(await response.arrayBuffer());
    const contentType = response.headers.get("content-type") || "image/png";

    // 5. Store the fresh data in Redis
    // We use a pipeline for efficiency to set multiple fields and the expiration
    const pipeline = redis.pipeline();
    pipeline.hset(cacheKey, {
        buffer: imageBuffer.toString('binary'), // Store buffer as a binary-safe string
        contentType: contentType,
    });
    pipeline.expire(cacheKey, CACHE_TTL_SECONDS);
    await pipeline.exec();

    console.log(`[Image Cache SET] Stored in Redis: ${imageUrl}`);

    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=604800, immutable",
        "X-Cache-Status": "MISS",
      },
    });

  } catch (error: any) {
    console.error(`[Image Proxy] Failed to process image request for ${imageUrl}: ${error.message}`);
    // Redirect to a placeholder on error to prevent broken images
    return NextResponse.redirect(new URL("/images/placeholder-logo.svg", request.url));
  }
}