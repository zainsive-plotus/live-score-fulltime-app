// ===== src/app/api/posts/route.ts =====

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/dbConnect";
import Post, { IPost, NewsType, SportsCategory } from "@/models/Post";
import { getNews } from "@/lib/data/news";
import slugify from "slugify";
import mongoose from "mongoose";

const DEFAULT_LOCALE = "tr";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const locale = searchParams.get("language") || DEFAULT_LOCALE;
    const sportsCategory = searchParams.get(
      "sportsCategory"
    ) as SportsCategory | null;
    const newsType = searchParams.get("newsType") as NewsType | null;
    const pageParam = searchParams.get("page");
    const limitParam = searchParams.get("limit");
    const fixtureIdParam = searchParams.get("linkedFixtureId");
    const page = pageParam ? parseInt(pageParam, 10) : 1;
    const limit = limitParam ? parseInt(limitParam, 10) : 10;
    const linkedFixtureId = fixtureIdParam
      ? parseInt(fixtureIdParam, 10)
      : undefined;

    const { posts, pagination } = await getNews({
      locale,
      sportsCategory: sportsCategory || undefined,
      newsType: newsType || undefined,
      page,
      limit,
      linkedFixtureId,
    });

    return NextResponse.json({ posts, pagination });
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

    // MODIFIED: Destructure the new focusKeyword from the request body
    const { title, slug, content, language, focusKeyword } = body;

    if (!title || !content || !language) {
      return NextResponse.json(
        { error: "Title, content, and language are required" },
        { status: 400 }
      );
    }

    await dbConnect();

    const finalSlug = slugify(slug || title, { lower: true, strict: true });

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
      focusKeyword: focusKeyword, // ADDED: Save the focus keyword
      author: session.user.name || "Admin",
      translationGroupId: body.translationGroupId
        ? new mongoose.Types.ObjectId(body.translationGroupId)
        : new mongoose.Types.ObjectId(),
    });

    await newPost.save();
    return NextResponse.json(newPost, { status: 201 });
  } catch (error: any) {
    console.error("[API/posts POST] Server error creating post:", error);
    if (error.code === 11000) {
      return NextResponse.json(
        {
          error:
            "This slug is already in use for this language. Please choose a unique slug.",
        },
        { status: 409 }
      );
    }
    if (error.name === "ValidationError") {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "An unexpected server error occurred while creating the post." },
      { status: 500 }
    );
  }
}
