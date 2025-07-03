// src/app/api/admin/ai-journalists/[journalistId]/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/dbConnect";
import AIJournalist, { IAIJournalist } from "@/models/AIJournalist";

interface Params {
  params: { journalistId: string };
}

// GET handler to retrieve a single AI Journalist (optional, but good for editing)
export async function GET(request: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await dbConnect();

  try {
    const { journalistId } = params;
    const journalist = await AIJournalist.findById(journalistId).lean();

    if (!journalist) {
      return NextResponse.json(
        { error: "AI Journalist not found." },
        { status: 404 }
      );
    }

    return NextResponse.json(journalist, { status: 200 });
  } catch (error: any) {
    console.error(
      `Error fetching AI Journalist ${params.journalistId}:`,
      error.message
    );
    return NextResponse.json(
      { error: "Server error fetching AI Journalist." },
      { status: 500 }
    );
  }
}

// PUT handler to update an existing AI Journalist
export async function PUT(request: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await dbConnect();

  try {
    const { journalistId } = params;
    const body: Partial<IAIJournalist> = await request.json();
    const { name, description, tonePrompt, isActive } = body;

    // Optional: Basic validation if all fields are sent in PUT
    // If only partial updates are expected, this validation might be too strict.
    // Assuming a full form submission for update.
    if (!name || !tonePrompt) {
      return NextResponse.json(
        { error: "Name and Tone Prompt are required." },
        { status: 400 }
      );
    }

    const updatedJournalist = await AIJournalist.findByIdAndUpdate(
      journalistId,
      { name, description, tonePrompt, isActive },
      { new: true, runValidators: true } // Return the updated document, run schema validators
    );

    if (!updatedJournalist) {
      return NextResponse.json(
        { error: "AI Journalist not found." },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedJournalist, { status: 200 });
  } catch (error: any) {
    console.error(
      `Error updating AI Journalist ${params.journalistId}:`,
      error.message
    );
    if (error.code === 11000) {
      // Duplicate key error
      return NextResponse.json(
        { error: "Journalist with this name already exists." },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Server error updating AI Journalist." },
      { status: 500 }
    );
  }
}

// DELETE handler to delete an AI Journalist
export async function DELETE(request: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await dbConnect();

  try {
    const { journalistId } = params;
    const deletedJournalist = await AIJournalist.findByIdAndDelete(
      journalistId
    );

    if (!deletedJournalist) {
      return NextResponse.json(
        { error: "AI Journalist not found." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "AI Journalist deleted successfully." },
      { status: 200 }
    );
  } catch (error: any) {
    console.error(
      `Error deleting AI Journalist ${params.journalistId}:`,
      error.message
    );
    return NextResponse.json(
      { error: "Server error deleting AI Journalist." },
      { status: 500 }
    );
  }
}
