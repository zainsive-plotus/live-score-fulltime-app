import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Post from "@/models/Post";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");
  const locale = searchParams.get("locale");

  if (!slug || !locale) {
    return NextResponse.json(
      { error: "Slug and locale are required" },
      { status: 400 }
    );
  }

  try {
    await dbConnect();
    const post = await Post.findOne({
      slug,
      language: locale,
      status: "published",
    }).lean();

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Convert ObjectId to string for serialization
    const serializablePost = JSON.parse(JSON.stringify(post));

    return NextResponse.json(serializablePost);
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
