import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/dbConnect";
import Language from "@/models/Language";
import path from "path";
import { promises as fs } from "fs";

// Ensure this path is correct for your project structure
const LOCALES_DIR = path.join(process.cwd(), "src/locales");

// Helper function to ensure the locales directory exists
const ensureLocalesDirExists = async () => {
  try {
    await fs.mkdir(LOCALES_DIR, { recursive: true });
  } catch (error) {
    console.error("Could not create locales directory:", error);
    throw new Error(
      "Server configuration error: Could not access locales directory."
    );
  }
};

export async function GET(request: Request) {
  // The session check is now inside the try block and is used for logic, not just rejection.
  await dbConnect();

  try {
    const session = await getServerSession(authOptions);
    const isAdmin = session?.user?.role === "admin";

    // If the user is an admin, the query is empty (gets all).
    // If not, it only gets active languages for public use.
    const query = isAdmin ? {} : { isActive: true };

    const languages = await Language.find(query).sort({ name: 1 });
    return NextResponse.json(languages, { status: 200 });
  } catch (error: any) {
    console.error(
      "[API/admin/languages] Error fetching languages:",
      error.message
    );
    return NextResponse.json(
      { error: "Server error fetching languages." },
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
    const body = await request.json();
    const { name, code, isDefault, isActive, flagUrl } = body;

    if (!name || !code) {
      return NextResponse.json(
        { error: "Name and code are required." },
        { status: 400 }
      );
    }

    // Create language in DB
    const newLanguage = new Language({
      name,
      code,
      isDefault,
      isActive,
      flagUrl,
    });
    await newLanguage.save();

    // Create corresponding JSON file
    await ensureLocalesDirExists();
    const filePath = path.join(LOCALES_DIR, `${code}.json`);
    await fs.writeFile(filePath, JSON.stringify({}, null, 2), "utf-8");

    // Here we should trigger a cache invalidation in a real-world scenario
    // For now, we'll just log it
    console.log(
      `[I18N_CACHE] Invalidation needed. Language '${code}' was added.`
    );

    return NextResponse.json(newLanguage, { status: 201 });
  } catch (error: any) {
    console.error("Error creating language:", error);
    if (error.code === 11000) {
      return NextResponse.json(
        { error: `Language with code or name already exists.` },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Server error creating language." },
      { status: 500 }
    );
  }
}
