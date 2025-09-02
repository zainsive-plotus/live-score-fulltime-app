// ===== src/app/api/admin/tracked-links/[id]/route.ts =====

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/dbConnect";
import TrackedLink, { ITrackedLink } from "@/models/TrackedLink";

interface Params {
  params: { id: string };
}

// PUT handler to update an existing link
export async function PUT(request: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = params;
  try {
    const body: Partial<ITrackedLink> = await request.json();
    const {
      originalUrl,
      description,
      utmSource,
      utmMedium,
      utmCampaign,
      isActive,
    } = body;

    if (!originalUrl || !description) {
      return NextResponse.json(
        { error: "Original URL and Description are required." },
        { status: 400 }
      );
    }

    await dbConnect();

    // Find the link by its MongoDB ID and update it
    const updatedLink = await TrackedLink.findByIdAndUpdate(
      id,
      {
        originalUrl,
        description,
        utmSource,
        utmMedium,
        utmCampaign,
        isActive,
      },
      { new: true, runValidators: true } // Options to return the updated document and run schema validations
    );

    if (!updatedLink) {
      return NextResponse.json({ error: "Link not found." }, { status: 404 });
    }

    return NextResponse.json(updatedLink, { status: 200 });
  } catch (error) {
    console.error(`[API/admin/tracked-links] PUT Error for ID ${id}:`, error);
    return NextResponse.json(
      { error: "Server error updating link." },
      { status: 500 }
    );
  }
}

// DELETE handler to remove a link
export async function DELETE(request: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = params;
  try {
    await dbConnect();
    const deletedLink = await TrackedLink.findByIdAndDelete(id);

    if (!deletedLink) {
      return NextResponse.json({ error: "Link not found." }, { status: 404 });
    }

    return NextResponse.json(
      { message: "Link deleted successfully." },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      `[API/admin/tracked-links] DELETE Error for ID ${id}:`,
      error
    );
    return NextResponse.json(
      { error: "Server error deleting link." },
      { status: 500 }
    );
  }
}
