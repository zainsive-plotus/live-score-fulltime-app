import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/dbConnect";
import axios from "axios";
import SeoContent from "@/models/SeoContent";
import SeoTemplate from "@/models/SeoTemplate";
import vm from "vm";

const BASE_URL =
  process.env.NEXT_PUBLIC_PUBLIC_APP_URL || "http://localhost:3000";

// --- Helper Functions (copied from main runner for encapsulation) ---

const evaluateExpression = (expression: string, context: object): any => {
  try {
    const sandbox = vm.createContext(context);
    return vm.runInContext(expression, sandbox, { timeout: 1000 });
  } catch (error: any) {
    console.error(
      `[VM Sandbox Error] Failed to execute expression "${expression}":`,
      error.message
    );
    return `[ERROR: ${error.message}]`;
  }
};

const populateTemplate = (
  template: string,
  variables: Record<string, string | number>
) => {
  let populated = template;
  for (const key in variables) {
    populated = populated.replace(
      new RegExp(`{${key}}`, "g"),
      String(variables[key] || "")
    );
  }
  return populated;
};

const getDynamicDataForEntity = async (pageType: string, entityId: string) => {
  // We need to fetch the basic entity info first to pass to the detailed fetcher
  // This is a simplified approach for regeneration.
  switch (pageType) {
    case "league-standings":
      const { data } = await axios.get(
        `${BASE_URL}/api/standings?league=${entityId}&season=${new Date().getFullYear()}`
      );
      return data;
    default:
      return {};
  }
};

// --- Main API Route ---
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { pageType, entityId, language } = await request.json();
    if (!pageType || !entityId || !language) {
      return NextResponse.json(
        { error: "pageType, entityId, and language are required." },
        { status: 400 }
      );
    }

    await dbConnect();

    // 1. Fetch the master template for this page type and language
    const masterTemplate = await SeoTemplate.findOne({
      pageType,
      language,
    }).lean();
    if (!masterTemplate) {
      return NextResponse.json(
        {
          error: `Master template for '${pageType}' in '${language}' not found.`,
        },
        { status: 404 }
      );
    }

    // 2. Fetch the detailed, dynamic data for this specific entity
    const dynamicData = await getDynamicDataForEntity(pageType, entityId);
    if (!dynamicData) {
      return NextResponse.json(
        { error: `Could not fetch dynamic data for entity ${entityId}.` },
        { status: 404 }
      );
    }

    const variables: Record<string, any> = {};
    const variableMappings = masterTemplate.variableMappings.reduce(
      (acc, item) => {
        acc[item.variable] = item.path;
        return acc;
      },
      {} as Record<string, string>
    );

    // 3. Evaluate expressions to get variables
    for (const key in variableMappings) {
      const expression = variableMappings[key];
      const context = { apiResponse: dynamicData };
      variables[key] = evaluateExpression(expression, context);
    }

    // 4. Populate the template with the new variables
    const generatedSeoText = populateTemplate(
      masterTemplate.template,
      variables
    );

    // 5. Update the specific SeoContent document in the database
    await SeoContent.updateOne(
      { pageType, entityId, language },
      {
        $set: { seoText: generatedSeoText },
        $setOnInsert: { pageType, entityId, language },
      },
      { upsert: true }
    );

    return NextResponse.json({
      message: `Successfully regenerated content for entity ${entityId}.`,
    });
  } catch (error: any) {
    console.error("[SEO Regenerate Error]", error);
    return NextResponse.json(
      { error: "An error occurred while regenerating content." },
      { status: 500 }
    );
  }
}
