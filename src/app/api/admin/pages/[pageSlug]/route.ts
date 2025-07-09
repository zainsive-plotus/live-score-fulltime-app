// src/app/api/admin/pages/[pageSlug]/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/dbConnect";
import PageContent from "@/models/PageContent";

interface Params {
  params: { pageSlug: string };
}

// GET handler for fetching content for the admin editor
export async function GET(request: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { pageSlug } = params;
  await dbConnect();

  const pageContent = await PageContent.findOne({ pageSlug });

  // If no content exists yet for this slug, return a default structure
  if (!pageContent) {
    return NextResponse.json({
      pageSlug,
      title: "",
      content: "",
    });
  }

  return NextResponse.json(pageContent);
}

// POST handler to create or update page content
export async function POST(request: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { pageSlug } = params;
  try {
    const body = await request.json();
    const { title, content } = body;

    if (!title || !content) {
      return NextResponse.json(
        { error: "Title and content are required." },
        { status: 400 }
      );
    }

    await dbConnect();

    // Use findOneAndUpdate with "upsert: true" to either update the existing page or create it if it doesn't exist.
    // This simplifies our logic greatly.
    const updatedContent = await PageContent.findOneAndUpdate(
      { pageSlug },
      { title, content },
      {
        new: true, // Return the new, updated document
        upsert: true, // Create the document if it doesn't exist
        runValidators: true,
      }
    );

    return NextResponse.json(updatedContent, { status: 200 });
  } catch (error: any) {
    console.error(
      `[API/admin/pages] POST Error for slug "${pageSlug}":`,
      error
    );
    return NextResponse.json(
      { error: error.message || "Failed to save page content." },
      { status: 500 }
    );
  }
}
