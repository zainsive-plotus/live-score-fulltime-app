// ===== src/app/api/admin/seo-runner/translate-single/route.ts =====

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import {
  runSeoGenerationForEntity,
  TemplateNotFoundError,
  DataFetchError,
} from "@/lib/seo-engine";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { pageType, entityId } = await request.json();
    if (!pageType || !entityId) {
      return NextResponse.json(
        { error: "pageType and entityId are required." },
        { status: 400 }
      );
    }

    // Call the engine without specifying languages, so it processes ALL active ones.
    const result = await runSeoGenerationForEntity({
      pageType,
      entityId,
    });

    return NextResponse.json({ message: result.message });
  } catch (error: any) {
    console.error(`[API/translate-single] Failed for entity:`, error);

    // Handle specific errors from the engine
    if (error instanceof TemplateNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error instanceof DataFetchError) {
      return NextResponse.json({ error: error.message }, { status: 502 });
    }

    // Fallback for any other unexpected errors
    return NextResponse.json(
      { error: "An unexpected error occurred while translating content." },
      { status: 500 }
    );
  }
}
