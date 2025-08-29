import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/dbConnect";
import SeoContent, { ISeoContent } from "@/models/SeoContent";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const pageType = searchParams.get("pageType");

  if (!pageType) {
    return NextResponse.json(
      { error: "pageType is a required parameter." },
      { status: 400 }
    );
  }

  try {
    await dbConnect();

    const contents = await SeoContent.find({ pageType }).lean();

    return NextResponse.json(contents);
  } catch (error) {
    console.error(
      `[API/seo-content] Error fetching content for ${pageType}:`,
      error
    );
    return NextResponse.json(
      { error: "Server error fetching SEO content." },
      { status: 500 }
    );
  }
}
