// ===== src/app/api/admin/referrer-rules/route.ts =====

import { NextResponse, NextRequest } from "next/server";
import dbConnect from "@/lib/dbConnect";
import ReferrerRule, { IReferrerRule } from "@/models/ReferrerRule";

const getHandler = async (request: NextRequest) => {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = 15;
    const skip = (page - 1) * limit;

    const [rules, totalCount] = await Promise.all([
      ReferrerRule.find({})
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      ReferrerRule.countDocuments({}),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      rules,
      pagination: { currentPage: page, totalPages, totalCount },
    });
  } catch (error) {
    console.error("[API/admin/referrer-rules] GET Error:", error);
    return NextResponse.json(
      { error: "Server error fetching referrer rules." },
      { status: 500 }
    );
  }
};

const postHandler = async (request: NextRequest) => {
  try {
    const body: Partial<IReferrerRule> = await request.json();
    const { sourceUrl, description, isActive } = body;

    if (!sourceUrl || !description) {
      return NextResponse.json(
        { error: "Source URL and Description are required." },
        { status: 400 }
      );
    }

    await dbConnect();
    const newRule = new ReferrerRule({
      sourceUrl,
      description,
      isActive: isActive !== undefined ? isActive : true,
    });
    await newRule.save();
    return NextResponse.json(newRule, { status: 201 });
  } catch (error: any) {
    if (error.code === 11000) {
      return NextResponse.json(
        { error: "A rule for this Source URL already exists." },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Server error creating referrer rule." },
      { status: 500 }
    );
  }
};

export const GET = getHandler;
export const POST = postHandler;
