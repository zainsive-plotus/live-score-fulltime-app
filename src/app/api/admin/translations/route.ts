import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import path from "path";
import { promises as fs } from "fs";
import { i18nCache } from "@/lib/i18n/i18n.cache";
const LOCALES_DIR = path.join(process.cwd(), "src/locales");

// GET /api/admin/translations?locale=en (No changes needed here)
export async function GET(request: Request) {
  // ... existing GET code ...
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const locale = searchParams.get("locale");

  if (!locale) {
    return NextResponse.json(
      { error: "Locale parameter is required." },
      { status: 400 }
    );
  }

  try {
    const filePath = path.join(LOCALES_DIR, `${locale}.json`);
    const fileContent = await fs.readFile(filePath, "utf-8");
    return NextResponse.json(JSON.parse(fileContent), { status: 200 });
  } catch (error: any) {
    if (error.code === "ENOENT") {
      return NextResponse.json(
        { error: `Translation file for locale '${locale}' not found.` },
        { status: 404 }
      );
    }
    console.error(
      `Error reading translation file for locale '${locale}':`,
      error
    );
    return NextResponse.json(
      { error: "Server error reading translation file." },
      { status: 500 }
    );
  }
}

// POST /api/admin/translations
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { locale, content } = await request.json();

    if (!locale || content === undefined) {
      return NextResponse.json(
        { error: "Locale and content are required." },
        { status: 400 }
      );
    }

    let parsedContent;
    try {
      parsedContent =
        typeof content === "string" ? JSON.parse(content) : content;
    } catch (e) {
      return NextResponse.json(
        { error: "Invalid JSON content provided." },
        { status: 400 }
      );
    }

    const filePath = path.join(LOCALES_DIR, `${locale}.json`);
    await fs.writeFile(
      filePath,
      JSON.stringify(parsedContent, null, 2),
      "utf-8"
    );

    // ----- THE FIX IS HERE -----
    // After writing the file, trigger a cache reload across the application.
    await i18nCache.reload();
    console.log(
      `[I18N_CACHE] Reload triggered by update to '${locale}' translations.`
    );

    return NextResponse.json(
      { message: `Translations for '${locale}' saved successfully.` },
      { status: 200 }
    );
  } catch (error: any) {
    console.error(`Error writing translation file:`, error);
    return NextResponse.json(
      { error: "Server error saving translation file." },
      { status: 500 }
    );
  }
}
