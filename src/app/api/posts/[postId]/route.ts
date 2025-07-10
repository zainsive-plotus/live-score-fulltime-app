// ===== src/app/api/posts/[postId]/route.ts =====

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/dbConnect";
import Post, { IPost } from "@/models/Post"; // Import IPost from the updated model

interface Params {
  params: { postId: string };
}

// --- GET a Single Post (by ID) (No change needed) ---
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
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// --- UPDATED: PUT (Update) a Post ---
export async function PUT(request: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { postId } = params;
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
      sportsCategory, // Renamed field
      newsType, // New field
      linkedFixtureId, // New field
      linkedLeagueId, // New field
      linkedTeamId, // New field
    } = body;

    if (!Array.isArray(sportsCategory) || sportsCategory.length === 0) {
      return NextResponse.json(
        { error: "At least one sports category is required." },
        { status: 400 }
      );
    }

    await dbConnect();

    // Use $set to update fields and $unset to remove them if they are empty/undefined
    const updatePayload: any = {
      $set: {
        title,
        content,
        status,
        featuredImage,
        metaTitle,
        metaDescription,
        featuredImageTitle,
        featuredImageAltText,
        sportsCategory,
        newsType,
      },
      $unset: {},
    };

    // Conditionally add linked IDs to the payload or unset them
    if (linkedFixtureId) {
      updatePayload.$set.linkedFixtureId = linkedFixtureId;
    } else {
      updatePayload.$unset.linkedFixtureId = "";
    }
    if (linkedLeagueId) {
      updatePayload.$set.linkedLeagueId = linkedLeagueId;
    } else {
      updatePayload.$unset.linkedLeagueId = "";
    }
    if (linkedTeamId) {
      updatePayload.$set.linkedTeamId = linkedTeamId;
    } else {
      updatePayload.$unset.linkedTeamId = "";
    }

    // If there's nothing to unset, remove the empty $unset operator
    if (Object.keys(updatePayload.$unset).length === 0) {
      delete updatePayload.$unset;
    }

    const updatedPost = await Post.findByIdAndUpdate(postId, updatePayload, {
      new: true,
      runValidators: true,
    });

    if (!updatedPost) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    return NextResponse.json(updatedPost);
  } catch (error: any) {
    if (error.name === "ValidationError") {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("Error updating post:", error);
    return NextResponse.json(
      { error: "Server error updating post" },
      { status: 500 }
    );
  }
}

// --- DELETE a Post (No change needed) ---
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
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
