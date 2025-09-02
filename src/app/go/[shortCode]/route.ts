// ===== src/app/go/[shortCode]/route.ts =====

import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import TrackedLink from "@/models/TrackedLink";
import { headers } from "next/headers";
import crypto from "crypto";

// This function will run for every incoming short link click
export async function GET(
  request: NextRequest,
  { params }: { params: { shortCode: string } }
) {
  const { shortCode } = params;

  if (!shortCode) {
    // If no short code is provided, redirect to the homepage
    return NextResponse.redirect(new URL("/", request.url));
  }

  try {
    await dbConnect();

    // Find the link by its unique, indexed shortCode
    const link = await TrackedLink.findOne({
      shortCode,
      isActive: true,
    }).lean();

    if (!link) {
      // If the link doesn't exist or is disabled, redirect to a 404 page or homepage
      return NextResponse.redirect(new URL("/404", request.url));
    }

    // --- Asynchronous Analytics Logging ---
    // We don't wait for this to complete before redirecting the user.
    // This makes the redirect feel instantaneous.
    (async () => {
      try {
        const headersList = headers();

        // Get user's IP for analytics. Hash it for privacy.
        const ip = headersList.get("x-forwarded-for") || "unknown";
        const ipHash = crypto.createHash("sha256").update(ip).digest("hex");

        await TrackedLink.updateOne(
          { _id: link._id },
          {
            $inc: { clickCount: 1 },
            $push: {
              analytics: {
                $each: [
                  {
                    ipHash,
                    userAgent: headersList.get("user-agent") || "unknown",
                    referrer: headersList.get("referer") || "unknown",
                  },
                ],
                $slice: -1000, // Keep only the last 1000 click records
              },
            },
          }
        );
      } catch (analyticsError) {
        console.error(
          `[Link Tracker] Failed to log analytics for ${shortCode}:`,
          analyticsError
        );
      }
    })();
    // --- End of Analytics Logging ---

    // Construct the final destination URL with UTM parameters
    const destinationUrl = new URL(link.originalUrl);
    if (link.utmSource)
      destinationUrl.searchParams.set("utm_source", link.utmSource);
    if (link.utmMedium)
      destinationUrl.searchParams.set("utm_medium", link.utmMedium);
    if (link.utmCampaign)
      destinationUrl.searchParams.set("utm_campaign", link.utmCampaign);

    // Perform a permanent (301) redirect
    return NextResponse.redirect(destinationUrl.toString(), 301);
  } catch (error) {
    console.error(
      `[Link Tracker] Critical error for shortCode ${shortCode}:`,
      error
    );
    // In case of a server error, fall back to the homepage
    return NextResponse.redirect(new URL("/", request.url));
  }
}

// Ensure this route is always dynamically rendered
export const dynamic = "force-dynamic";
