import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/dbConnect";
import Post, { IPost } from "@/models/Post";
import slugify from "slugify";
import ExternalNewsArticle from "@/models/ExternalNewsArticle";

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
    // Finds posts that INCLUDE this category
    query.sportsCategory = { $in: [sportsCategory] };
  } else if (excludeSportsCategory) {
    // Finds posts that DO NOT INCLUDE this category
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
      sportsCategory,
      newsType,
      linkedFixtureId,
      linkedLeagueId,
      linkedTeamId,
    } = body;

    if (!title || !content) {
      return NextResponse.json(
        { error: "Title and content are required" },
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
      sportsCategory,
      newsType,
      linkedFixtureId,
      linkedLeagueId,
      linkedTeamId,
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
