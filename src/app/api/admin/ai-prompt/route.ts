// ===== src/app/api/admin/ai-prompt/route.ts =====

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/dbConnect";
import AIPrompt, { IAIPrompt, AIPromptType } from "@/models/AIPrompt";

// GET handler to find a specific prompt by name and type
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await dbConnect();

  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get("name");
    const type = searchParams.get("type") as AIPromptType;

    if (!name || !type) {
      return NextResponse.json(
        { error: "Prompt name and type are required." },
        { status: 400 }
      );
    }

    const prompt = await AIPrompt.findOne({ name, type }).lean();

    if (!prompt) {
      return NextResponse.json(
        { error: `Prompt '${name}' of type '${type}' not found.` },
        { status: 404 }
      );
    }

    return NextResponse.json(prompt, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching AI Prompt:", error.message);
    return NextResponse.json(
      { error: "Server error fetching AI Prompt." },
      { status: 500 }
    );
  }
}

// --- NEW: PUT handler to update an existing AI Prompt ---
export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await dbConnect();

  try {
    const body: { id: string; description?: string; prompt: string } =
      await request.json();
    const { id, description, prompt } = body;

    if (!id || !prompt) {
      return NextResponse.json(
        { error: "Prompt ID and content are required for update." },
        { status: 400 }
      );
    }

    const updatedPrompt = await AIPrompt.findByIdAndUpdate(
      id,
      { description, prompt },
      { new: true, runValidators: true } // Return the updated document
    );

    if (!updatedPrompt) {
      return NextResponse.json(
        { error: "AI Prompt not found." },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedPrompt, { status: 200 });
  } catch (error: any) {
    console.error("Error updating AI Prompt:", error.message);
    return NextResponse.json(
      { error: "Server error updating AI Prompt." },
      { status: 500 }
    );
  }
}
