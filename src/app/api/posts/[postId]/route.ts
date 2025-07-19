import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/dbConnect";
import Post, { IPost } from "@/models/Post";

interface Params {
  params: Promise<{ postId: string }>;
}

export async function GET(request: Request, { params }: Params) {
  const { postId } = await params;
  try {
    await dbConnect();
    const post = await Post.findById(postId);
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }
    return NextResponse.json(post);
  } catch (error) {
    console.error("Error fetching post by ID:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// ----- REPLACE THE ENTIRE PUT FUNCTION WITH THIS NEW VERSION -----
export async function PUT(request: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { postId } = await params;
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
      sportsCategory,
      newsType,
      linkedFixtureId,
      linkedLeagueId,
      linkedTeamId,
      // Note: 'language' and 'translationGroupId' are intentionally omitted
      // We do not allow changing these fields on an existing post.
    } = body;

    if (!title || !content) {
      return NextResponse.json(
        { error: "Title and content are required." },
        { status: 400 }
      );
    }

    if (!Array.isArray(sportsCategory) || sportsCategory.length === 0) {
      return NextResponse.json(
        { error: "At least one sports category is required." },
        { status: 400 }
      );
    }

    await dbConnect();

    // Check if the post to be updated exists
    const existingPost = await Post.findById(postId);
    if (!existingPost) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

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

    if (Object.keys(updatePayload.$unset).length === 0) {
      delete updatePayload.$unset;
    }

    const updatedPost = await Post.findByIdAndUpdate(postId, updatePayload, {
      new: true,
      runValidators: true,
    });

    return NextResponse.json(updatedPost);
  } catch (error: any) {
    if (error.name === "ValidationError") {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error(`Error updating post ${postId}:`, error);
    return NextResponse.json(
      { error: "Server error updating post" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { postId } = await params;
  try {
    await dbConnect();
    const deletedPost = await Post.findByIdAndDelete(postId);
    if (!deletedPost) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }
    return NextResponse.json({ message: "Post deleted successfully" });
  } catch (error) {
    console.error(`Error deleting post ${postId}:`, error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
