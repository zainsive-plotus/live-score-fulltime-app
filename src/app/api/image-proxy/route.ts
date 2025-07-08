// src/app/api/image-proxy/route.ts

import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

// --- SECURITY: A whitelist of allowed domains to prevent abuse ---
const ALLOWED_DOMAINS = [
  "media.api-sports.io",
  "cdn.fanskor.com", // Your CDN must be in this list
  "images.unsplash.com",
];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const imageUrl = searchParams.get("url");

  // 1. Validate input
  if (!imageUrl) {
    return NextResponse.json(
      { error: "Image URL is required" },
      { status: 400 }
    );
  }

  // 2. Security Check: Ensure the requested URL is from an allowed domain
  try {
    const urlObject = new URL(imageUrl);
    if (!ALLOWED_DOMAINS.includes(urlObject.hostname)) {
      return NextResponse.json(
        { error: `Domain not allowed: ${urlObject.hostname}` },
        { status: 403 }
      );
    }
  } catch (error) {
    return NextResponse.json({ error: "Invalid URL format" }, { status: 400 });
  }

  try {
    // 3. Fetch the image from the external source
    const response = await axios.get(imageUrl, {
      responseType: "arraybuffer",
      timeout: 10000, // 10-second timeout
    });

    const imageBuffer = Buffer.from(response.data, "binary");
    const contentType = response.headers["content-type"] || "image/png";

    // 4. Return the image with your custom, strong caching headers
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        // Cache on CDN and client browser for 7 days
        "Cache-Control": "public, max-age=604800, s-maxage=604800, immutable",
      },
    });
  } catch (error: any) {
    console.error(`[Image Proxy] Failed to fetch ${imageUrl}:`, error.code);

    // --- IMPROVED ERROR HANDLING ---
    // If the error is the exact DNS error we saw, return a specific message
    if (error.code === "ENOTFOUND") {
      return NextResponse.json(
        {
          error: `DNS resolution failed for the target image URL: ${imageUrl}`,
        },
        { status: 504 } // 504 Gateway Timeout is appropriate here
      );
    }

    // For other errors, return a generic 502 Bad Gateway
    return NextResponse.json(
      {
        error: `Failed to fetch image from upstream server. Reason: ${error.message}`,
      },
      { status: 502 }
    );
  }
}
