// ===== src/app/api/admin/referrer-rules/[id]/route.ts =====

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/dbConnect";
import ReferrerRule, { IReferrerRule } from "@/models/ReferrerRule";
import { refreshReferrerCache } from "../route"; // Import the cache utility

interface Params {
  params: { id: string };
}

// PUT handler to update an existing rule
export async function PUT(request: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = params;
  try {
    const body: Partial<IReferrerRule> = await request.json();
    const { sourceUrl, targetPage, description, isActive } = body;

    if (!sourceUrl || !targetPage || !description) {
      return NextResponse.json(
        { error: "Source URL, Target Page, and Description are required." },
        { status: 400 }
      );
    }

    await dbConnect();

    const updatedRule = await ReferrerRule.findByIdAndUpdate(
      id,
      {
        sourceUrl,
        targetPage,
        description,
        isActive,
      },
      { new: true, runValidators: true }
    );

    if (!updatedRule) {
      return NextResponse.json(
        { error: "Referrer rule not found." },
        { status: 404 }
      );
    }

    // Refresh the Redis cache after the update
    await refreshReferrerCache();

    return NextResponse.json(updatedRule, { status: 200 });
  } catch (error: any) {
    console.error(`[API/admin/referrer-rules] PUT Error for ID ${id}:`, error);
    if (error.code === 11000) {
      return NextResponse.json(
        { error: "A rule for this Source URL already exists." },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Server error updating rule." },
      { status: 500 }
    );
  }
}

// DELETE handler to remove a rule
export async function DELETE(request: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = params;
  try {
    await dbConnect();
    const deletedRule = await ReferrerRule.findByIdAndDelete(id);

    if (!deletedRule) {
      return NextResponse.json(
        { error: "Referrer rule not found." },
        { status: 404 }
      );
    }

    // Refresh the Redis cache after the deletion
    await refreshReferrerCache();

    return NextResponse.json(
      { message: "Referrer rule deleted successfully." },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      `[API/admin/referrer-rules] DELETE Error for ID ${id}:`,
      error
    );
    return NextResponse.json(
      { error: "Server error deleting rule." },
      { status: 500 }
    );
  }
}
