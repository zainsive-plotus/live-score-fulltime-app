// ===== src/app/api/admin/referrer-rules/[id]/route.ts =====

import { NextResponse, NextRequest } from "next/server";
import dbConnect from "@/lib/dbConnect";
import ReferrerRule, { IReferrerRule } from "@/models/ReferrerRule";

interface Params {
  params: { id: string };
}

const putHandler = async (request: NextRequest, { params }: Params) => {
  const { id } = params;
  try {
    const body: Partial<IReferrerRule> = await request.json();
    // --- FIX: Removed 'targetPage' from destructuring and validation ---
    const { sourceUrl, description, isActive } = body;

    if (!sourceUrl || !description) {
      return NextResponse.json(
        { error: "Source URL and Description are required." },
        { status: 400 }
      );
    }

    await dbConnect();

    const updatedRule = await ReferrerRule.findByIdAndUpdate(
      id,
      { sourceUrl, description, isActive },
      { new: true, runValidators: true }
    );

    if (!updatedRule) {
      return NextResponse.json(
        { error: "Referrer rule not found." },
        { status: 404 }
      );
    }
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
};

const deleteHandler = async (request: NextRequest, { params }: Params) => {
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
    return NextResponse.json(
      { message: "Referrer rule deleted successfully." },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Server error deleting rule." },
      { status: 500 }
    );
  }
};

export const PUT = putHandler;
export const DELETE = deleteHandler;
