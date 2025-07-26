// ===== src/app/api/highlights/latest/route.ts =====

import { NextResponse } from "next/server";
import { getLatestPopularHighlights } from "@/lib/data/highlightly";
import axios from "axios";

/**
 * Validates if an embed URL is accessible by making a HEAD request.
 * This is much faster than a full GET request as it only fetches headers.
 * @param url The URL to validate.
 * @returns boolean True if the URL is valid and returns a success status, false otherwise.
 */
async function isValidEmbed(url: string): Promise<boolean> {
  try {
    const response = await axios.head(url, {
      timeout: 3000, // 3-second timeout
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    });
    // Check for a 2xx success status code
    return response.status >= 200 && response.status < 300;
  } catch (error) {
    // Any error (404, 403, timeout, etc.) means the link is invalid for our purposes.
    return false;
  }
}

export async function GET(request: Request) {
  try {
    const latestHighlights = await getLatestPopularHighlights();

    if (!latestHighlights || latestHighlights.length === 0) {
      return NextResponse.json({ highlights: [] }, { status: 200 });
    }

    // --- Start: Validation Logic ---
    // Create an array of validation promises for all fetched highlights
    const validationPromises = latestHighlights.map((highlight: any) =>
      isValidEmbed(highlight.embedUrl)
    );

    // Run all validation checks in parallel and wait for them to complete
    const validationResults = await Promise.allSettled(validationPromises);

    // Filter the original highlights array, keeping only the ones that passed validation
    const validHighlights = latestHighlights.filter((_, index) => {
      const result = validationResults[index];
      return result.status === "fulfilled" && result.value === true;
    });
    // --- End: Validation Logic ---

    const headers = new Headers();
    headers.set(
      "Cache-control",
      "public, s-maxage=300, stale-while-revalidate=600"
    );

    // Return the clean, validated list of highlights
    return NextResponse.json(
      { highlights: validHighlights },
      { status: 200, headers }
    );
  } catch (error: any) {
    console.error(
      `[API/highlights/latest] Error fetching or validating popular highlights:`,
      error.message
    );
    return NextResponse.json(
      { error: "Failed to fetch latest highlights from the provider." },
      { status: 502 }
    );
  }
}