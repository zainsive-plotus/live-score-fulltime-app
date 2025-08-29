import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/dbConnect";
import SeoContent from "@/models/SeoContent";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { pageType, entityId } = await request.json();

    if (!pageType || !entityId) {
      return NextResponse.json(
        { error: "pageType and entityId are required." },
        { status: 400 }
      );
    }

    await dbConnect();

    const result = await SeoContent.deleteMany({ pageType, entityId });

    if (result.deletedCount === 0) {
      return NextResponse.json({
        message: "No content found to delete for this entity.",
      });
    }

    return NextResponse.json({
      message: `Successfully deleted ${result.deletedCount} content document(s) for entity ${entityId}.`,
    });
  } catch (error: any) {
    console.error("[SEO Runner Delete Error]", error);
    return NextResponse.json(
      { error: "An error occurred while deleting SEO content." },
      { status: 500 }
    );
  }
}
