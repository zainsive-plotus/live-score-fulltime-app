// src/app/api/image-proxy/route.ts

import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

// --- SECURITY: A whitelist of allowed domains to prevent abuse ---
// This ensures our proxy can only be used to fetch images from trusted sources.
const ALLOWED_DOMAINS = [
  "media.api-sports.io",
  // Add other trusted image source domains here if needed in the future
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
        { error: "Domain not allowed" },
        { status: 403 }
      );
    }
  } catch (error) {
    return NextResponse.json({ error: "Invalid URL format" }, { status: 400 });
  }

  try {
    // 3. Fetch the image from the external source
    const response = await axios.get(imageUrl, {
      responseType: "arraybuffer", // Fetch as raw data
    });

    const imageBuffer = Buffer.from(response.data, "binary");
    const contentType = response.headers["content-type"] || "image/png";

    // 4. Return the image with our custom, strong caching headers
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        // Cache for 7 days, immutable means the browser won't even check for updates
        "Cache-Control": "public, max-age=604800, immutable",
      },
    });
  } catch (error) {
    console.error(`[Image Proxy] Failed to fetch ${imageUrl}:`, error);
    // You could return a placeholder image here if you wanted
    return NextResponse.json(
      { error: "Failed to fetch image" },
      { status: 502 }
    ); // 502 Bad Gateway
  }
}
