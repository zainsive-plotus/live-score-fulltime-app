// ===== src/app/api/admin/translations/manage/route.ts =====

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/dbConnect";
import Translation, { ITranslation } from "@/models/Translation";
import { i18nCache } from "@/lib/i18n/i18n.cache";

// Helper to invalidate cache after any change
const invalidateAndRespond = async (data: any, status: number) => {
  // Invalidate the cache in the background, don't wait for it
  i18nCache.reload().catch((err) => {
    console.error("[TRANSLATION API] Failed to invalidate i18n cache:", err);
  });
  return NextResponse.json(data, { status });
};

// GET all translations
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    await dbConnect();
    // ***** CHANGE HERE: Added .lean() for performance and to return plain JS objects *****
    const translations = await Translation.find({})
      .sort({ group: 1, key: 1 })
      .lean();
    return NextResponse.json(translations, { status: 200 });
  } catch (error) {
    console.error("[API/admin/translations/manage GET] Error:", error);
    return NextResponse.json(
      { error: "Server error fetching translations." },
      { status: 500 }
    );
  }
}

// CREATE a new translation key
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { key, group, description, translations } = body;

    if (!key || !group || !translations || !translations.en) {
      return NextResponse.json(
        {
          error: "Key, group, and a default English translation are required.",
        },
        { status: 400 }
      );
    }

    await dbConnect();
    // Mongoose will correctly cast the incoming plain object to a Map here
    const newTranslation = new Translation({
      key,
      group,
      description,
      translations,
    });
    await newTranslation.save();

    return invalidateAndRespond(newTranslation, 201);
  } catch (error: any) {
    if (error.code === 11000) {
      return NextResponse.json(
        { error: "A translation with this key already exists." },
        { status: 409 }
      );
    }
    console.error("[API/admin/translations/manage POST] Error:", error);
    return NextResponse.json(
      { error: "Server error creating translation." },
      { status: 500 }
    );
  }
}

// UPDATE a translation key
export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body: ITranslation = await request.json();
    const { _id, translations, description, group } = body;

    if (!_id || !translations) {
      return NextResponse.json(
        { error: "Translation ID and translations object are required." },
        { status: 400 }
      );
    }

    await dbConnect();
    const updatedTranslation = await Translation.findByIdAndUpdate(
      _id,
      { translations, description, group },
      { new: true, runValidators: true }
    );

    if (!updatedTranslation) {
      return NextResponse.json(
        { error: "Translation not found." },
        { status: 404 }
      );
    }

    return invalidateAndRespond(updatedTranslation, 200);
  } catch (error) {
    console.error("[API/admin/translations/manage PUT] Error:", error);
    return NextResponse.json(
      { error: "Server error updating translation." },
      { status: 500 }
    );
  }
}

// DELETE a translation key
export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { id } = await request.json();
    if (!id) {
      return NextResponse.json(
        { error: "Translation ID is required for deletion." },
        { status: 400 }
      );
    }

    await dbConnect();
    const deleted = await Translation.findByIdAndDelete(id);

    if (!deleted) {
      return NextResponse.json(
        { error: "Translation not found." },
        { status: 404 }
      );
    }

    return invalidateAndRespond(
      { message: "Translation deleted successfully." },
      200
    );
  } catch (error) {
    console.error("[API/admin/translations/manage DELETE] Error:", error);
    return NextResponse.json(
      { error: "Server error deleting translation." },
      { status: 500 }
    );
  }
}
