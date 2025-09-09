// ===== src/app/api/posts/[postId]/route.ts =====

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/dbConnect";
import Post, { IPost } from "@/models/Post";
import slugify from "slugify";

interface Params {
  params: { postId: string };
}

export async function GET(request: Request, { params }: Params) {
  const { postId } = params;
  try {
    await dbConnect();
    const post = await Post.findById(postId);
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }
    return NextResponse.json(post);
  } catch (error) {
    console.error(`[API/posts GET] Error fetching post ${postId}:`, error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { postId } = params;
  try {
    // MODIFIED: The body type now includes all keyword fields
    const body: Partial<IPost> & {
      slug?: string;
      focusKeyword?: string;
      secondaryKeywords?: string[];
      supportingKeywords?: string[];
    } = await request.json();

    const { title, slug, content } = body;

    if (!title || !content) {
      return NextResponse.json(
        { error: "Title and content are required." },
        { status: 400 }
      );
    }

    await dbConnect();

    const existingPost = await Post.findById(postId);
    if (!existingPost) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const finalSlug = slugify(slug || title, { lower: true, strict: true });

    const slugExists = await Post.findOne({
      slug: finalSlug,
      language: existingPost.language,
      _id: { $ne: postId },
    });

    if (slugExists) {
      return NextResponse.json(
        {
          error: `The slug '${finalSlug}' is already in use by another post in this language.`,
        },
        { status: 409 }
      );
    }

    // MODIFIED: The update payload now includes all keyword fields.
    // We spread the `...body` to include all other fields from the request.
    const updatedPost = await Post.findByIdAndUpdate(
      postId,
      { ...body, slug: finalSlug },
      { new: true, runValidators: true }
    );

    return NextResponse.json(updatedPost);
  } catch (error: any) {
    console.error(`[API/posts PUT] Error updating post ${postId}:`, error);
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
      { error: "An unexpected server error occurred while updating the post." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { postId } = params;
  try {
    await dbConnect();
    const deletedPost = await Post.findByIdAndDelete(postId);
    if (!deletedPost) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }
    return NextResponse.json({ message: "Post deleted successfully" });
  } catch (error) {
    console.error(`[API/posts DELETE] Error deleting post ${postId}:`, error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
