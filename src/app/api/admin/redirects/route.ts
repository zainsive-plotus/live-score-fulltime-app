// ===== src/app/api/admin/redirects/route.ts (NEW FILE) =====

import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Redirect, { IRedirect } from "@/models/Redirect";
import { updateRedirectCache } from "@/lib/redirect-cache";

// --- GET all redirects (paginated) ---
export async function GET(request: Request) {
  // Add admin session check here
  await dbConnect();
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = 15;
  const skip = (page - 1) * limit;

  const [redirects, totalCount] = await Promise.all([
    Redirect.find({}).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Redirect.countDocuments({}),
  ]);

  return NextResponse.json({
    redirects,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(totalCount / limit),
    },
  });
}

// --- POST a new redirect ---
export async function POST(request: Request) {
  // Add admin session check here
  await dbConnect();
  try {
    const body = await request.json();
    const newRedirect = new Redirect(body);
    await newRedirect.save();
    await updateRedirectCache(); // Invalidate and update cache
    return NextResponse.json(newRedirect, { status: 201 });
  } catch (error: any) {
    if (error.code === 11000) {
      return NextResponse.json(
        { error: "One of the source paths is already in use." },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create redirect." },
      { status: 500 }
    );
  }
}
