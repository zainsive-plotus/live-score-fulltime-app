// src/app/api/pages/[pageSlug]/route.ts
import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import PageContent from "@/models/PageContent";

interface Params {
  params: { pageSlug: string };
}

// GET handler for fetching content for a single public page
export async function GET(request: Request, { params }: Params) {
  try {
    const { pageSlug } = params;
    if (!pageSlug) {
      return NextResponse.json(
        { error: "Page slug is required." },
        { status: 400 }
      );
    }

    await dbConnect();

    const pageContent = await PageContent.findOne({ pageSlug }).lean();

    if (!pageContent) {
      return NextResponse.json(
        { error: "Page content not found." },
        { status: 404 }
      );
    }

    return NextResponse.json(pageContent);
  } catch (error) {
    console.error(
      `[API/pages] Error fetching page content for slug "${params.pageSlug}":`,
      error
    );
    return NextResponse.json(
      { error: "Server error fetching page content." },
      { status: 500 }
    );
  }
}
