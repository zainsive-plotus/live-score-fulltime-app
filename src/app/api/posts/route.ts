// src/app/api/posts/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/dbConnect";
import Post, { IPost } from "@/models/Post";
import slugify from "slugify";
// --- NEW: Import ExternalNewsArticle model directly into this file ---
import ExternalNewsArticle from "@/models/ExternalNewsArticle";

// --- GET All Posts ---
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const limit = searchParams.get("limit");

  const query: { status?: string } = {};
  if (status) {
    query.status = status;
  }

  try {
    await dbConnect(); // This still connects, and imports in dbConnect.ts register models
    // --- THE FIX IS HERE: Pass ExternalNewsArticle model object directly to populate ---
    let postsQuery = Post.find(query).sort({ createdAt: -1 }).populate({
      path: "originalExternalArticleId",
      model: ExternalNewsArticle, // <-- Pass the imported Model object here
      select: "title link",
    });

    const posts = await postsQuery;
    return NextResponse.json(posts);
  } catch (error) {
    console.error("Failed to fetch posts:", error);
    return NextResponse.json(
      { error: "Server error fetching posts" },
      { status: 500 }
    );
  }
}

// --- POST a New Post ---
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body: Partial<IPost> = await request.json();
    const {
      title,
      content,
      status,
      featuredImage,
      metaTitle,
      metaDescription,
      featuredImageTitle,
      featuredImageAltText,
      sport,
    } = body;

    if (!title || !content) {
      return NextResponse.json(
        { error: "Title and content are required" },
        { status: 400 }
      );
    }

    await dbConnect();

    const slug = slugify(title, { lower: true, strict: true });
    const slugExists = await Post.findOne({ slug });
    if (slugExists) {
      return NextResponse.json(
        {
          error: `A post with the slug '${slug}' already exists. Please use a different title.`,
        },
        { status: 409 }
      );
    }

    const newPost = new Post({
      title,
      content,
      status,
      slug,
      author: session.user.name || "Admin",
      featuredImage,
      metaTitle,
      metaDescription,
      featuredImageTitle,
      featuredImageAltText,
      sport,
    });

    await newPost.save();
    return NextResponse.json(newPost, { status: 201 });
  } catch (error) {
    console.error("Failed to create post:", error);
    return NextResponse.json(
      { error: "Server error creating post" },
      { status: 500 }
    );
  }
}
