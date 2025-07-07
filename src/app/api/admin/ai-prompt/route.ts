// src/app/api/admin/ai-journalists/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/dbConnect";
import AIJournalist, { IAIJournalist } from "@/models/AIJournalist";

// GET handler to retrieve a list of all AI Journalists (UNCHANGED)
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await dbConnect();

  try {
    const journalists = await AIJournalist.find({}).sort({ name: 1 }).lean();
    return NextResponse.json(journalists, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching AI Journalists:", error.message);
    return NextResponse.json(
      { error: "Server error fetching AI Journalists." },
      { status: 500 }
    );
  }
}

// POST handler to create a new AI Journalist
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await dbConnect();

  try {
    const body: Partial<IAIJournalist> = await request.json();
    const { name, description, tonePrompt, isActive } = body;

    if (!name || !tonePrompt) {
      return NextResponse.json(
        { error: "Name and Tone Prompt are required." },
        { status: 400 }
      );
    }

    const newJournalist = new AIJournalist({
      name,
      description,
      tonePrompt,
      isActive: isActive !== undefined ? isActive : true, // Default to active
    });

    await newJournalist.save();
    return NextResponse.json(newJournalist, { status: 201 });
  } catch (error: any) {
    console.error("Error creating AI Journalist:", error.message);
    if (error.code === 11000) {
      // Duplicate key error
      return NextResponse.json(
        { error: "Journalist with this name already exists." },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Server error creating AI Journalist." },
      { status: 500 }
    );
  }
}
