// ===== src/app/api/admin/seo-templates/route.ts =====

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/dbConnect";
import SeoTemplate from "@/models/SeoTemplate";
import { DEFAULT_LOCALE } from "@/lib/i18n/config";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const pageType = searchParams.get("pageType");
  const language = searchParams.get("language");

  if (!pageType || !language) {
    return NextResponse.json(
      { error: "pageType and language are required." },
      { status: 400 }
    );
  }

  await dbConnect();
  const template = await SeoTemplate.findOne({ pageType, language }).lean();

  if (!template) {
    // If no template is found, return a default empty structure.
    // This prevents errors if a template for a language hasn't been created yet.
    return NextResponse.json({
      pageType,
      language,
      template: "",
      variableMappings: [],
    });
  }

  return NextResponse.json(template);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { pageType, language, template, variableMappings } =
      await request.json();
    if (!pageType || !language || template === undefined) {
      return NextResponse.json(
        { error: "pageType, language, and template are required." },
        { status: 400 }
      );
    }

    await dbConnect();

    // --- THIS IS THE ROBUST LOGIC FIX ---

    // 1. Define the base update operation. It ALWAYS includes the template content.
    const updateOperation: {
      $set: { template: string; variableMappings?: any };
      $setOnInsert: any;
    } = {
      $set: {
        template: template,
      },
      // $setOnInsert ensures these fields are set only when a new document is created (upsert: true).
      $setOnInsert: {
        pageType,
        language,
      },
    };

    // 2. ONLY if the language is the default one, we add the `variableMappings`
    //    field to the `$set` object. This is the crucial step.
    if (language === DEFAULT_LOCALE) {
      // The frontend now sends the correct array structure, so we can use it directly.
      // We still check if it's an array for safety.
      if (Array.isArray(variableMappings)) {
        updateOperation.$set.variableMappings = variableMappings;
      }
    }
    // For any other language, the `$set` object will ONLY contain the `template` key.
    // Mongoose will therefore only update that one field and leave `variableMappings` untouched.

    const updatedTemplate = await SeoTemplate.findOneAndUpdate(
      { pageType, language },
      updateOperation, // Use the precisely constructed operation
      { upsert: true, new: true, runValidators: true }
    );

    return NextResponse.json(updatedTemplate, { status: 200 });
  } catch (error: any) {
    console.error("[API/seo-templates] POST Error:", error);
    // This will now correctly catch the Mongoose validation error if the frontend sends the wrong shape
    if (error.name === "ValidationError") {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Server error saving template." },
      { status: 500 }
    );
  }
}
