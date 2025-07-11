// ===== src/app/api/admin/title-templates/[templateId]/route.ts =====

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/dbConnect";
import TitleTemplate, { ITitleTemplate } from "@/models/TitleTemplate";

interface Params {
  params: { templateId: string };
}

export async function GET(request: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await dbConnect();

  try {
    const { templateId } = params;
    const template = await TitleTemplate.findById(templateId).lean();

    if (!template) {
      return NextResponse.json(
        { error: "Title Template not found." },
        { status: 404 }
      );
    }

    return NextResponse.json(template, { status: 200 });
  } catch (error: any) {
    console.error(
      `Error fetching Title Template ${params.templateId}:`,
      error.message
    );
    return NextResponse.json(
      { error: "Server error fetching Title Template." },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await dbConnect();

  try {
    const { templateId } = params;
    const body: Partial<ITitleTemplate> = await request.json();
    const { name, description, template, isActive } = body;

    if (!name || !template) {
      return NextResponse.json(
        { error: "Name and Template content are required." },
        { status: 400 }
      );
    }

    const updatedTemplate = await TitleTemplate.findByIdAndUpdate(
      templateId,
      { name, description, template, isActive },
      { new: true, runValidators: true }
    );

    if (!updatedTemplate) {
      return NextResponse.json(
        { error: "Title Template not found." },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedTemplate, { status: 200 });
  } catch (error: any) {
    console.error(
      `Error updating Title Template ${params.templateId}:`,
      error.message
    );
    if (error.code === 11000) {
      return NextResponse.json(
        { error: "A template with this name already exists." },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Server error updating Title Template." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await dbConnect();

  try {
    const { templateId } = params;
    const deletedTemplate = await TitleTemplate.findByIdAndDelete(templateId);

    if (!deletedTemplate) {
      return NextResponse.json(
        { error: "Title Template not found." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Title Template deleted successfully." },
      { status: 200 }
    );
  } catch (error: any) {
    console.error(
      `Error deleting Title Template ${params.templateId}:`,
      error.message
    );
    return NextResponse.json(
      { error: "Server error deleting Title Template." },
      { status: 500 }
    );
  }
}
