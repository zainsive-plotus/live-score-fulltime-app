// ===== src/app/api/track/referrer-hit/route.ts =====

import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import ReferrerRule from "@/models/ReferrerRule";
import { headers } from "next/headers";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sourceUrl, landingPage } = body;

    // Basic validation
    if (!sourceUrl || !landingPage) {
      return NextResponse.json(
        { error: "sourceUrl and landingPage are required." },
        { status: 400 }
      );
    }

    await dbConnect();

    const headersList = headers();
    const ip = (await headersList).get("x-forwarded-for") || "unknown";
    const ipHash = crypto.createHash("sha256").update(ip).digest("hex");

    // Find the active rule that matches the start of the sourceUrl
    const result = await ReferrerRule.updateOne(
      {
        // Use a regex to match if the referrer starts with the sourceUrl
        $expr: { $eq: [0, { $indexOfCP: [sourceUrl, "$sourceUrl"] }] },
        isActive: true,
      },
      {
        $inc: { hitCount: 1 },
        $push: {
          analytics: {
            $each: [
              {
                ipHash,
                userAgent: (await headersList).get("user-agent") || "unknown",
                landingPage: landingPage,
                timestamp: new Date(),
              },
            ],
            $slice: -500, // Keep only the most recent 500 hits per rule
          },
        },
      }
    );

    if (result.modifiedCount === 0) {
      // This is expected if a referrer doesn't match any rule, so we don't log an error.
      // We just return a success response to not indicate a problem.
      return NextResponse.json(
        { success: true, status: "No matching rule found." },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { success: true, status: "Hit recorded." },
      { status: 200 }
    );
  } catch (error) {
    // This endpoint should never fail loudly, as it's a background task.
    // We log the error on the server but return a success response.
    console.error("[API/referrer-hit] Error recording referrer hit:", error);
    return NextResponse.json(
      { success: true, status: "Error logged on server." },
      { status: 200 }
    );
  }
}
