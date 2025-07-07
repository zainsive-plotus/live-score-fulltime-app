// src/app/api/posts/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/dbConnect";
import Post, { IPost, PostCategory } from "@/models/Post";
import slugify from "slugify";
import ExternalNewsArticle from "@/models/ExternalNewsArticle";

// --- GET All Posts (No change needed) ---
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const limit = searchParams.get("limit");

  const query: { status?: string } = {};
  if (status) {
    query.status = status;
  }

  try {
    await dbConnect();
    let postsQuery = Post.find(query).sort({ createdAt: -1 }).populate({
      path: "originalExternalArticleId",
      model: ExternalNewsArticle,
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

// --- POST a New Post (Updated to handle category array) ---
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
      sport, // This will now be an array
    } = body;

    if (!title || !content) {
      return NextResponse.json(
        { error: "Title and content are required" },
        { status: 400 }
      );
    }

    // --- MODIFIED: Validate that `sport` is a non-empty array ---
    if (!Array.isArray(sport) || sport.length === 0) {
      return NextResponse.json(
        { error: "At least one category is required." },
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
      sport: sport as PostCategory[], // --- MODIFIED: Save the array
    });

    await newPost.save();
    return NextResponse.json(newPost, { status: 201 });
  } catch (error: any) {
    if (error.name === "ValidationError") {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("Failed to create post:", error);
    return NextResponse.json(
      { error: "Server error creating post" },
      { status: 500 }
    );
  }
}
