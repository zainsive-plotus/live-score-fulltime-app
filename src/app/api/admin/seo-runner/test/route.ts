// ===== src/app/api/admin/seo-runner/test/route.ts =====

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import axios from "axios";
import vm from "vm";

const BASE_URL =
  process.env.NEXT_PUBLIC_PUBLIC_APP_URL || "http://localhost:3000";

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

// MODIFIED: This function now fetches the complete list of standings-eligible leagues from our internal API.
const getEntitiesForPageType = async (pageType: string) => {
  switch (pageType) {
    case "league-standings":
      // Fetching all leagues (using a large limit) from our own optimized and cached endpoint.
      const { data } = await axios.get(
        `${BASE_URL}/api/directory/standings-leagues?limit=10000`
      );
      return data.leagues || []; // Return the leagues array from the response
    default:
      throw new Error(`Unsupported pageType: ${pageType}`);
  }
};

const getDynamicDataForEntity = async (pageType: string, entity: any) => {
  switch (pageType) {
    case "league-standings":
      const { data } = await axios.get(
        `${BASE_URL}/api/standings?league=${
          entity.id
        }&season=${new Date().getFullYear()}`
      );
      return data;
    default:
      return {};
  }
};

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { pageType, template, variableMappings } = await request.json();
    if (!pageType || !template) {
      return NextResponse.json(
        { error: "pageType and template are required for a test run." },
        { status: 400 }
      );
    }

    const entities = await getEntitiesForPageType(pageType);
    if (!entities || entities.length === 0) {
      return NextResponse.json(
        { error: `No test entities found for page type: ${pageType}` },
        { status: 404 }
      );
    }
    const testEntity = entities[0];

    const dynamicData = await getDynamicDataForEntity(pageType, testEntity);

    const extractedVariables: Record<string, any> = {};

    for (const key in variableMappings) {
      const expression = variableMappings[key];
      const context = { apiResponse: dynamicData };
      extractedVariables[key] = evaluateExpression(expression, context);
    }

    const generatedHtml = populateTemplate(template, extractedVariables);

    return NextResponse.json({
      generatedHtml,
      extractedVariables,
      testEntityName: testEntity.name || testEntity.team.name,
    });
  } catch (error: any) {
    console.error("[SEO Runner Test] Error:", error);
    return NextResponse.json(
      { error: "An error occurred during the test run." },
      { status: 500 }
    );
  }
}
