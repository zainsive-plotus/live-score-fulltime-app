import { NextRequest, NextResponse } from "next/server";

const ALLOWED_DOMAINS = [
  "media.api-sports.io",
  "media-1.api-sports.io",
  "media-2.api-sports.io",
  "media-3.api-sports.io",
  "cdn.fanskor.com",
  "images.unsplash.com",
];

export async function GET(request: NextRequest) {
  // --- LOGGING STEP 1: Log the incoming request ---
  console.log(`[Image Proxy] Received request: ${request.url}`);

  const { searchParams } = new URL(request.url);
  const imageUrl = searchParams.get("url");

  if (!imageUrl) {
    console.error(
      "[Image Proxy] Error: Image URL is missing from query parameters."
    );
    return NextResponse.json(
      { error: "Image URL is required" },
      { status: 400 }
    );
  }

  // --- LOGGING STEP 2: Log the target URL ---
  console.log(`[Image Proxy] Attempting to proxy URL: ${imageUrl}`);

  try {
    const urlObject = new URL(imageUrl);
    if (!ALLOWED_DOMAINS.includes(urlObject.hostname)) {
      // --- LOGGING STEP 3: Log security blocks ---
      console.warn(
        `[Image Proxy] BLOCKED request to disallowed domain: ${urlObject.hostname}`
      );
      return NextResponse.json(
        { error: `Domain not allowed: ${urlObject.hostname}` },
        { status: 403 }
      );
    }
  } catch (error) {
    console.error(`[Image Proxy] Error: Invalid URL format for "${imageUrl}"`);
    return NextResponse.json({ error: "Invalid URL format" }, { status: 400 });
  }

  try {
    // --- LOGGING STEP 4: Log before the actual fetch ---
    console.log(`[Image Proxy] Fetching from upstream: ${imageUrl}`);
    const response = await fetch(imageUrl, {
      next: { revalidate: 60 * 60 * 24 }, // Cache the response for 1 day
      headers: {
        // Some services require a user-agent
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    });

    // --- LOGGING STEP 5: Log the response status from the external server ---
    console.log(
      `[Image Proxy] Upstream response status: ${response.status} for ${imageUrl}`
    );

    if (!response.ok) {
      throw new Error(
        `Upstream fetch failed with status ${response.status} ${response.statusText}`
      );
    }

    const imageBuffer = Buffer.from(await response.arrayBuffer());
    const contentType = response.headers.get("content-type") || "image/png";

    // --- LOGGING STEP 6: Log success before returning the image ---
    console.log(
      `[Image Proxy] SUCCESS: Successfully fetched and returning image for ${imageUrl}`
    );

    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=604800, s-maxage=604800, immutable",
      },
    });
  } catch (error: any) {
    // --- LOGGING STEP 7: Log the ENTIRE error object for maximum detail ---
    console.error(`[Image Proxy] CRITICAL FAILURE for URL: ${imageUrl}`, error);

    return NextResponse.json(
      {
        error: `Failed to process image proxy request. Reason: ${error.message}`,
      },
      { status: 502 } // 502 Bad Gateway is appropriate for a failed proxy request
    );
  }
}
