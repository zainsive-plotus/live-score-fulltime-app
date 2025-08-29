import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/dbConnect";
import SeoTemplate from "@/models/SeoTemplate";

// GET a specific template
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
    // Return a default structure if no template exists yet, allows frontend to work seamlessly
    return NextResponse.json({
      pageType,
      language,
      template: "",
      variableMappings: [],
    });
  }

  return NextResponse.json(template);
}

// ** THE FIX IS HERE: Add the POST handler to save templates **
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

    const variableMappingsForDB = Object.entries(variableMappings || {}).map(
      ([key, value]) => ({
        variable: key,
        path: value as string,
      })
    );

    const updatedTemplate = await SeoTemplate.findOneAndUpdate(
      { pageType, language },
      { template, variableMappings: variableMappingsForDB },
      { upsert: true, new: true, runValidators: true }
    );

    return NextResponse.json(updatedTemplate, { status: 200 });
  } catch (error) {
    console.error("[API/seo-templates POST] Error saving template:", error);
    return NextResponse.json(
      { error: "Server error saving template." },
      { status: 500 }
    );
  }
}
