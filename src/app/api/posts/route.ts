// ===== src/app/api/posts/route.ts (Upgraded) =====

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/dbConnect";
import Post, { IPost, SportsCategory } from "@/models/Post";
import slugify from "slugify";
import mongoose from "mongoose";
import { getNews } from "@/lib/data/news"; // <-- 1. IMPORT OUR SMART FUNCTION

const DEFAULT_LOCALE = "tr";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  // 2. GET ALL PARAMETERS FROM THE REQUEST
  const locale = searchParams.get("language") || DEFAULT_LOCALE;
  const limit = searchParams.get("limit");
  const sportsCategory = searchParams.get(
    "sportsCategory"
  ) as SportsCategory | null;
  const excludeSportsCategory = searchParams.get(
    "excludeSportsCategory"
  ) as SportsCategory | null;
  // Note: We ignore other params like 'status' because getNews handles it.

  try {
    // 3. CALL OUR CURATED NEWS FUNCTION
    const curatedNews = await getNews({
      locale,
      sportsCategory: sportsCategory || undefined,
      excludeSportsCategory: excludeSportsCategory || undefined,
    });

    // 4. APPLY THE LIMIT AFTER CURATION
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

// The POST, PUT, DELETE functions remain unchanged, so we keep them.
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
    const {
      title,
      slug,
      content,
      status,
      featuredImage,
      metaTitle,
      metaDescription,
      featuredImageTitle,
      featuredImageAltText,
      sportsCategory,
      newsType,
      linkedFixtureId,
      linkedLeagueId,
      linkedTeamId,
      language,
      translationGroupId,
    } = body;

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
          error: `A post with the slug '${finalSlug}' already exists for the selected language. Please use a different title or slug.`,
        },
        { status: 409 }
      );
    }

    const finalTranslationGroupId = translationGroupId
      ? new mongoose.Types.ObjectId(translationGroupId)
      : new mongoose.Types.ObjectId();

    const newPost = new Post({
      title,
      content,
      status,
      slug: finalSlug,
      author: session.user.name || "Admin",
      featuredImage,
      metaTitle,
      metaDescription,
      featuredImageTitle,
      featuredImageAltText,
      sportsCategory,
      newsType,
      linkedFixtureId,
      linkedLeagueId,
      linkedTeamId,
      language,
      translationGroupId: finalTranslationGroupId,
    });

    await newPost.save();
    return NextResponse.json(newPost, { status: 201 });
  } catch (error: any) {
    if (error.name === "ValidationError") {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("[API/posts POST] Server error creating post:", error);
    return NextResponse.json(
      { error: "Server error creating post" },
      { status: 500 }
    );
  }
}
