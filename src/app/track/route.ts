// ===== src/app/track/route.ts =====

import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import dbConnect from "@/lib/dbConnect";
import ReferrerRule from "@/models/ReferrerRule";
import crypto from "crypto";

export const dynamic = "force-dynamic"; // Ensure this route is always dynamic

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const refCode = searchParams.get("ref");
  const fallbackUrl = new URL("/", request.url); // Default redirect to homepage

  if (!refCode) {
    // If no ref code is provided, just redirect to the homepage.
    return NextResponse.redirect(fallbackUrl);
  }

  try {
    await dbConnect();
    const rule = await ReferrerRule.findOne({ refCode, isActive: true });

    if (!rule) {
      // If the rule doesn't exist or isn't active, redirect to the homepage
      // to avoid showing a 404 or an error.
      console.warn(
        `[Tracker] Received a hit for an unknown or inactive refCode: ${refCode}`
      );
      return NextResponse.redirect(fallbackUrl);
    }

    // Fire-and-forget the analytics update.
    // We don't await this so the user redirect is as fast as possible.
    (async () => {
      try {
        const headersList = headers();
        const ip = headersList.get("x-forwarded-for") || "unknown";
        const ipHash = crypto.createHash("sha256").update(ip).digest("hex");

        await ReferrerRule.updateOne(
          { _id: rule._id },
          {
            $inc: { hitCount: 1 },
            $push: {
              analytics: {
                $each: [
                  {
                    ipHash,
                    userAgent: headersList.get("user-agent") || "unknown",
                  },
                ],
                $slice: -500, // Keep only the last 500 hits
              },
            },
          }
        );
      } catch (analyticsError) {
        console.error(
          `[Tracker] Failed to log analytics for refCode ${refCode}:`,
          analyticsError
        );
      }
    })();

    // Redirect the user to the final destination.
    // Using a 302 (temporary) redirect is often better for tracking links.
    return NextResponse.redirect(new URL(rule.destinationUrl), 302);
  } catch (error) {
    console.error(`[Tracker] Critical error for refCode ${refCode}:`, error);
    // In case of a database error, still redirect to the homepage gracefully.
    return NextResponse.redirect(fallbackUrl);
  }
}
