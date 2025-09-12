// ===== src/app/api/admin/referrer-rules/[id]/route.ts =====

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/dbConnect";
import ReferrerRule, { IReferrerRule } from "@/models/ReferrerRule";
import { refreshReferrerCache } from "../route";

interface Params {
  params: { id: string };
}

export async function PUT(request: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = params;
  try {
    const body: Partial<IReferrerRule> = await request.json();
    // --- FIX: Removed 'targetPage' from destructuring ---
    const { sourceUrl, description, isActive } = body;

    // --- FIX: Updated validation to match the new model ---
    if (!sourceUrl || !description) {
      return NextResponse.json(
        { error: "Source URL and Description are required." },
        { status: 400 }
      );
    }

    await dbConnect();

    const updatedRule = await ReferrerRule.findByIdAndUpdate(
      id,
      {
        sourceUrl,
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

    await refreshReferrerCache(); // Refresh cache after updating

    return NextResponse.json(updatedRule, { status: 200 });
  } catch (error: any) {
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

export async function DELETE(request: Request, { params }: Params) {
  // ... (DELETE function remains correct) ...
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
