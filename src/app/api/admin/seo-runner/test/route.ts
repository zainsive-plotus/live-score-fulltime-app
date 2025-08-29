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

const getEntitiesForPageType = async (pageType: string) => {
  switch (pageType) {
    case "league-standings":
      const { data } = await axios.get(
        `${BASE_URL}/api/directory/standings-leagues`
      );
      return data.leagues; // The API returns a `leagues` property
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

    // 1. Fetch all possible entities, but only take the first one for the test.
    const entities = await getEntitiesForPageType(pageType);
    if (!entities || entities.length === 0) {
      return NextResponse.json(
        { error: `No test entities found for page type: ${pageType}` },
        { status: 404 }
      );
    }
    const testEntity = entities[0];

    // 2. Fetch the detailed data for that single entity.
    const dynamicData = await getDynamicDataForEntity(pageType, testEntity);

    const extractedVariables: Record<string, any> = {};

    // 3. Evaluate the expressions in the sandbox to get the variables.
    for (const key in variableMappings) {
      const expression = variableMappings[key];
      const context = { apiResponse: dynamicData };
      extractedVariables[key] = evaluateExpression(expression, context);
    }

    // 4. Populate the template with the extracted variables.
    const generatedHtml = populateTemplate(template, extractedVariables);

    // 5. Return the result WITHOUT saving to the database.
    return NextResponse.json({
      generatedHtml,
      extractedVariables,
      testEntityName: testEntity.name || testEntity.team.name,
    });
  } catch (error: any) {
    console.error("[SEO Runner Test Error]", error);
    return NextResponse.json(
      { error: "An error occurred during the test run." },
      { status: 500 }
    );
  }
}
