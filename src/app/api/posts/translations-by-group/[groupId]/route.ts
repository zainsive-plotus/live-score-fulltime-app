// ===== src/app/api/posts/translations-by-group/[groupId]/route.ts =====

import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Post from "@/models/Post";

interface Params {
  params: { groupId: string };
}

export async function GET(request: Request, { params }: Params) {
  await dbConnect();
  const { groupId } = params;

  if (!groupId) {
    return NextResponse.json(
      { error: "Translation Group ID is required." },
      { status: 400 }
    );
  }

  try {
    const translations = await Post.find({
      translationGroupId: groupId,
      status: "published",
    })
      .select("slug language")
      .lean();

    return NextResponse.json(translations, { status: 200 });
  } catch (error: any) {
    console.error(
      `[API/translations-by-group] Server error for group ${groupId}:`,
      error.message
    );
    return NextResponse.json(
      { error: "Server error fetching translations." },
      { status: 500 }
    );
  }
}
