// ===== src/app/api/admin/posts/translations/[groupId]/route.ts =====

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/dbConnect";
import Post from "@/models/Post";

interface Params {
  params: { groupId: string };
}

export async function GET(request: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await dbConnect();

  const { groupId } = params;

  if (!groupId) {
    return NextResponse.json(
      { error: "Translation Group ID is required." },
      { status: 400 }
    );
  }

  try {
    // Find all posts that share the same translationGroupId
    const translations = await Post.find({ translationGroupId: groupId })
      .select("title slug language _id createdAt") // Select only the necessary fields for the UI
      .lean();

    return NextResponse.json(translations, { status: 200 });
  } catch (error: any) {
    console.error(`Error fetching translations for group ${groupId}:`, error);
    return NextResponse.json(
      { error: "Server error fetching translations." },
      { status: 500 }
    );
  }
}
