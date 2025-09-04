// ===== src/app/api/track/referrer-hit/route.ts =====

import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import ReferrerRule from "@/models/ReferrerRule";
import { headers } from "next/headers";
import crypto from "crypto";

// This endpoint is designed to be called internally by the middleware.
// It should not be exposed to the public.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sourceUrl, landingPage } = body;

    if (!sourceUrl || !landingPage) {
      return NextResponse.json(
        { error: "sourceUrl and landingPage are required." },
        { status: 400 }
      );
    }

    await dbConnect();

    const headersList = headers();
    const ip = headersList.get("x-forwarded-for") || "unknown";
    const ipHash = crypto.createHash("sha256").update(ip).digest("hex");

    // Find the rule by the sourceUrl and perform the update in one atomic operation.
    // This is highly efficient.
    const result = await ReferrerRule.updateOne(
      { sourceUrl: sourceUrl, isActive: true }, // Match the active rule
      {
        $inc: { hitCount: 1 }, // Increment the counter
        $push: {
          analytics: {
            $each: [
              {
                ipHash,
                userAgent: headersList.get("user-agent") || "unknown",
                landingPage: landingPage,
                timestamp: new Date(),
              },
            ],
            $slice: -500, // Keep only the last 500 detailed click records
          },
        },
      }
    );

    // If result.modifiedCount is 0, it means no rule was found for that sourceUrl.
    // We can log this for debugging if needed, but we don't need to send an error response.
    if (result.modifiedCount === 0) {
      console.warn(
        `[Referrer Tracker] Received a hit for an unknown or inactive sourceUrl: ${sourceUrl}`
      );
    }

    // Always return a success response quickly.
    // The middleware doesn't wait for this, but it's good practice.
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("[API/track/referrer-hit] POST Error:", error);
    // In case of an error, we still return a success status to not block anything,
    // but the error will be logged on the server.
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
