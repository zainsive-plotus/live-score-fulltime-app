// ===== src/app/api/redirects/check/route.ts (NEW FILE) =====

import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Redirect from "@/models/Redirect";

export const runtime = "nodejs"; // Ensure this runs in the Node.js runtime

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const pathname = searchParams.get("pathname");

  if (!pathname) {
    return NextResponse.json(
      { error: "Pathname is required." },
      { status: 400 }
    );
  }

  try {
    await dbConnect();

    // The index on `sourcePaths` in your model makes this query highly efficient.
    const redirect = await Redirect.findOne({
      sourcePaths: pathname,
      isActive: true,
    }).lean();

    if (redirect) {
      return NextResponse.json({
        destination: redirect.destinationUrl,
        status: redirect.statusCode,
      });
    }

    // It's important to return a 404 if no redirect is found.
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  } catch (error) {
    console.error("[API/redirects/check] Database query failed:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
