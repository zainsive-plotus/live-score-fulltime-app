// ===== src/app/api/admin/title-templates/route.ts =====

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/dbConnect";
import TitleTemplate, { ITitleTemplate } from "@/models/TitleTemplate";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    // Also allow public fetching of active templates for the dropdown
    const { searchParams } = new URL(request.url);
    if (searchParams.get("active") !== "true") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  await dbConnect();

  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get("active") === "true";

    const query = activeOnly ? { isActive: true } : {};

    const templates = await TitleTemplate.find(query).sort({ name: 1 }).lean();
    return NextResponse.json(templates, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching Title Templates:", error.message);
    return NextResponse.json(
      { error: "Server error fetching Title Templates." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await dbConnect();

  try {
    const body: Partial<ITitleTemplate> = await request.json();
    const { name, description, template, isActive } = body;

    if (!name || !template) {
      return NextResponse.json(
        { error: "Name and Template content are required." },
        { status: 400 }
      );
    }

    const newTemplate = new TitleTemplate({
      name,
      description,
      template,
      isActive: isActive !== undefined ? isActive : true,
    });

    await newTemplate.save();
    return NextResponse.json(newTemplate, { status: 201 });
  } catch (error: any) {
    if (error.code === 11000) {
      return NextResponse.json(
        { error: "A template with this name already exists." },
        { status: 409 }
      );
    }
    console.error("Error creating Title Template:", error.message);
    return NextResponse.json(
      { error: "Server error creating Title Template." },
      { status: 500 }
    );
  }
}
