import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/dbConnect";
import Post, { IPost } from "@/models/Post";
import slugify from "slugify";
import ExternalNewsArticle from "@/models/ExternalNewsArticle";
import mongoose from "mongoose";

// The GET function remains unchanged.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const limit = searchParams.get("limit");
  const linkedFixtureId = searchParams.get("linkedFixtureId");
  const linkedLeagueId = searchParams.get("linkedLeagueId");
  const linkedTeamId = searchParams.get("linkedTeamId");
  const sportsCategory = searchParams.get("sportsCategory");
  const excludeSportsCategory = searchParams.get("excludeSportsCategory");

  const query: any = {};
  if (status) query.status = status;
  if (linkedFixtureId) query.linkedFixtureId = Number(linkedFixtureId);
  if (linkedLeagueId) query.linkedLeagueId = Number(linkedLeagueId);
  if (linkedTeamId) query.linkedTeamId = Number(linkedTeamId);

  if (sportsCategory) {
    query.sportsCategory = { $in: [sportsCategory] };
  } else if (excludeSportsCategory) {
    query.sportsCategory = { $nin: [excludeSportsCategory] };
  }

  try {
    await dbConnect();
    let postsQuery = Post.find(query).sort({ createdAt: -1 });

    if (limit) {
      postsQuery = postsQuery.limit(parseInt(limit));
    }

    postsQuery = postsQuery.populate({
      path: "originalExternalArticleId",
      model: ExternalNewsArticle,
      select: "title link",
    });

    const posts = await postsQuery;
    return NextResponse.json(posts);
  } catch (error) {
    console.error("Error fetching posts:", error);
    return NextResponse.json(
      { error: "Server error fetching posts" },
      { status: 500 }
    );
  }
}

// ----- REPLACE THE ENTIRE POST FUNCTION WITH THIS NEW VERSION -----
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
      slug, // Now we accept a slug from the client
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

    // If a slug is provided, use it. Otherwise, generate it from the title.
    // Always run it through slugify to ensure it's clean.
    const finalSlug = slugify(slug || title, { lower: true, strict: true });

    // Check for slug uniqueness WITHIN the same language
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
      slug: finalSlug, // Use the final, clean slug
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
    console.error("Error creating post:", error);
    return NextResponse.json(
      { error: "Server error creating post" },
      { status: 500 }
    );
  }
}
