// ===== src/app/api/posts/route.ts (Enhanced Error Handling) =====

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/dbConnect";
import Post, { IPost } from "@/models/Post";
import slugify from "slugify";
import mongoose from "mongoose";
import { getNews } from "@/lib/data/news";

const DEFAULT_LOCALE = "tr";

export async function GET(request: Request) {
  // ... (GET handler remains the same)
  const { searchParams } = new URL(request.url);
  const locale = searchParams.get("language") || DEFAULT_LOCALE;
  const limit = searchParams.get("limit");
  const sportsCategory = searchParams.get("sportsCategory") as
    | IPost["sportsCategory"][number]
    | null;
  const excludeSportsCategory = searchParams.get("excludeSportsCategory") as
    | IPost["sportsCategory"][number]
    | null;

  try {
    const curatedNews = await getNews({
      locale,
      sportsCategory: sportsCategory || undefined,
      excludeSportsCategory: excludeSportsCategory || undefined,
    });
    const limitedNews = limit
      ? curatedNews.slice(0, parseInt(limit, 10))
      : curatedNews;
    return NextResponse.json(limitedNews);
  } catch (error) {
    console.error("[API/posts GET] Server error fetching posts:", error);
    return NextResponse.json(
      { error: "Server error fetching posts" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body: Partial<IPost> & {
      language: string;
      translationGroupId?: string;
      slug?: string;
    } = await request.json();
    const { title, slug, content, language } = body;

    if (!title || !content || !language) {
      return NextResponse.json(
        { error: "Title, content, and language are required" },
        { status: 400 }
      );
    }

    await dbConnect();

    const finalSlug = slugify(slug || title, { lower: true, strict: true });

    // This check is good for an immediate response, but the catch block is the ultimate safety net.
    const slugExists = await Post.findOne({ slug: finalSlug, language });
    if (slugExists) {
      return NextResponse.json(
        {
          error: `A post with the slug '${finalSlug}' already exists in this language.`,
        },
        { status: 409 }
      );
    }

    const newPost = new Post({
      ...body,
      slug: finalSlug,
      author: session.user.name || "Admin",
      translationGroupId: body.translationGroupId
        ? new mongoose.Types.ObjectId(body.translationGroupId)
        : new mongoose.Types.ObjectId(),
    });

    await newPost.save();
    return NextResponse.json(newPost, { status: 201 });
  } catch (error: any) {
    // --- THIS IS THE KEY CHANGE ---
    // Check for MongoDB's duplicate key error
    if (error.code === 11000) {
      return NextResponse.json(
        {
          error:
            "This slug is already in use for this language. Please choose a unique slug.",
        },
        { status: 409 } // 409 Conflict is the correct status code
      );
    }
    if (error.name === "ValidationError") {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("[API/posts POST] Server error creating post:", error);
    return NextResponse.json(
      { error: "An unexpected server error occurred while creating the post." },
      { status: 500 }
    );
  }
}
