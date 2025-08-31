// ===== src/app/api/seo-content/team-details/route.ts =====

import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import SeoContent from "@/models/SeoContent";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const teamId = searchParams.get("teamId");
  const language = searchParams.get("language");

  if (!teamId || !language) {
    return NextResponse.json(
      { error: "teamId and language are required parameters." },
      { status: 400 }
    );
  }

  try {
    await dbConnect();

    const content = await SeoContent.findOne({
      pageType: "team-details",
      entityId: teamId,
      language,
    }).lean();

    if (!content) {
      // It's important to return a 404 so the frontend knows there's no content to display
      return NextResponse.json(
        { error: "Content not found for this team and language." },
        { status: 404 }
      );
    }

    // Return only the text, as that's all the frontend component needs
    return NextResponse.json({ seoText: content.seoText });
  } catch (error) {
    console.error(
      `[API/seo-content/team-details] Error fetching content for team ${teamId}:`,
      error
    );
    return NextResponse.json(
      { error: "Server error fetching SEO content." },
      { status: 500 }
    );
  }
}
