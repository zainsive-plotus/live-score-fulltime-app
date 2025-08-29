import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import SeoContent from "@/models/SeoContent";

// This is a public route, no session check is needed.

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const leagueId = searchParams.get("leagueId");
  const language = searchParams.get("language");

  if (!leagueId || !language) {
    return NextResponse.json(
      { error: "leagueId and language are required parameters." },
      { status: 400 }
    );
  }

  try {
    await dbConnect();

    // Fetch the pre-generated content for this specific league and language
    const content = await SeoContent.findOne({
      pageType: "league-standings",
      entityId: leagueId,
      language,
    }).lean();

    if (!content) {
      return NextResponse.json(null, { status: 404 });
    }

    // Return only the necessary data
    return NextResponse.json({ seoText: content.seoText });
  } catch (error) {
    console.error(
      `[API/seo-content] Error fetching content for league ${leagueId}:`,
      error
    );
    return NextResponse.json(
      { error: "Server error fetching SEO content." },
      { status: 500 }
    );
  }
}
