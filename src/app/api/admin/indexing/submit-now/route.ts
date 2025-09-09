// ===== src/app/api/admin/indexing/submit-now/route.ts =====

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { submitUrlsToIndexNow } from "@/lib/indexnow";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { urls } = await request.json();

    if (!Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json(
        { error: "An array of URLs is required." },
        { status: 400 }
      );
    }

    // Call the server-side helper function
    const success = await submitUrlsToIndexNow(urls);

    if (success) {
      return NextResponse.json({ message: "Submission successful." });
    } else {
      return NextResponse.json(
        { error: "Submission failed. See server logs for details." },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("[API/submit-now] Error:", error);
    return NextResponse.json(
      { error: "Server error during IndexNow submission." },
      { status: 500 }
    );
  }
}
