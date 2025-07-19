import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/dbConnect";
import Post, { IPost } from "@/models/Post";
import slugify from "slugify"; // Import slugify

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

  const { postId } = params;
  try {
    const body: Partial<IPost> & { slug?: string } = await request.json();
    const {
      title,
      slug, // Now we accept the slug
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
    } = body;

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

    // If a slug is provided, use it. Otherwise, generate it from the title.
    const finalSlug = slugify(slug || title, { lower: true, strict: true });

    // Check if the new slug is already taken by another post in the same language
    const slugExists = await Post.findOne({
      slug: finalSlug,
      language: existingPost.language,
      _id: { $ne: postId }, // Exclude the current post from the check
    });

    if (slugExists) {
      return NextResponse.json(
        {
          error: `The slug '${finalSlug}' is already in use by another post in this language.`,
        },
        { status: 409 }
      );
    }

    const updatePayload: any = {
      $set: {
        title,
        slug: finalSlug, // Update the slug
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

  const { postId } = params;
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
