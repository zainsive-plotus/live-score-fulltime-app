import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/dbConnect";
import Language, { ILanguage } from "@/models/Language";
import path from "path";
import { promises as fs } from "fs";

const LOCALES_DIR = path.join(process.cwd(), "src/locales");

interface Params {
  params: { languageId: string };
}

export async function PUT(request: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { languageId } = params;
  await dbConnect();

  try {
    const body: Partial<ILanguage> = await request.json();

    // Ensure no one tries to update the code, which could de-sync files
    delete (body as any).code;

    // Handle the `isDefault` logic via the pre-save hook
    if (body.isDefault) {
      const language = await Language.findById(languageId);
      if (!language) {
        return NextResponse.json(
          { error: "Language not found." },
          { status: 404 }
        );
      }
      Object.assign(language, body);
      await language.save();
      const updatedLanguage = language.toObject();
      console.log(
        `[I18N_CACHE] Invalidation needed. Language default status changed.`
      );
      return NextResponse.json(updatedLanguage, { status: 200 });
    }

    // Standard update for other fields
    const updatedLanguage = await Language.findByIdAndUpdate(languageId, body, {
      new: true,
      runValidators: true,
    });

    if (!updatedLanguage) {
      return NextResponse.json(
        { error: "Language not found." },
        { status: 404 }
      );
    }

    console.log(
      `[I18N_CACHE] Invalidation needed. Language '${updatedLanguage.code}' was updated.`
    );
    return NextResponse.json(updatedLanguage, { status: 200 });
  } catch (error: any) {
    console.error(`Error updating language ${languageId}:`, error);
    if (error.code === 11000) {
      return NextResponse.json(
        { error: "Language name already exists." },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Server error updating language." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { languageId } = params;
  await dbConnect();

  try {
    const languageToDelete = await Language.findById(languageId);

    if (!languageToDelete) {
      return NextResponse.json(
        { error: "Language not found." },
        { status: 404 }
      );
    }

    if (languageToDelete.isDefault) {
      return NextResponse.json(
        { error: "Cannot delete the default language." },
        { status: 400 }
      );
    }

    await Language.findByIdAndDelete(languageId);

    // Delete corresponding JSON file
    const filePath = path.join(LOCALES_DIR, `${languageToDelete.code}.json`);
    try {
      await fs.unlink(filePath);
    } catch (fileError: any) {
      // If file doesn't exist, it's not a critical error, just log it.
      if (fileError.code !== "ENOENT") {
        console.error(`Error deleting language file ${filePath}:`, fileError);
      }
    }

    console.log(
      `[I18N_CACHE] Invalidation needed. Language '${languageToDelete.code}' was deleted.`
    );
    return NextResponse.json(
      { message: "Language deleted successfully." },
      { status: 200 }
    );
  } catch (error: any) {
    console.error(`Error deleting language ${languageId}:`, error);
    return NextResponse.json(
      { error: "Server error deleting language." },
      { status: 500 }
    );
  }
}
