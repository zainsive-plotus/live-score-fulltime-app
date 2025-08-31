// ===== src/app/api/admin/seo-runner/test/route.ts =====

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import axios from "axios";
import vm from "vm";
import {
  getTeamInfo,
  getTeamSquad,
  getTeamFixtures,
  getTeamStandings,
} from "@/lib/data/team";

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
    return `[EVAL_ERROR]`;
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

// MODIFIED: This function now correctly handles the 'team-details' case.
const getEntitiesForPageType = async (pageType: string) => {
  switch (pageType) {
    case "league-standings":
      const { data: leagueData } = await axios.get(
        `${BASE_URL}/api/directory/standings-leagues?limit=10000`
      );
      return leagueData.leagues;
    case "team-details": // ADDED THIS CASE
      const { data: teamData } = await axios.get(
        `${BASE_URL}/api/directory/teams-all`
      );
      return teamData || [];
    default:
      throw new Error(`Unsupported pageType: ${pageType}`);
  }
};

// MODIFIED: This function now correctly handles the 'team-details' case.
const getDynamicDataForEntity = async (pageType: string, entity: any) => {
  switch (pageType) {
    case "league-standings":
      const { data } = await axios.get(
        `${BASE_URL}/api/standings?league=${
          entity.id
        }&season=${new Date().getFullYear()}`
      );
      return data;
    case "team-details": // ADDED THIS CASE
      const [teamInfo, squad, fixtures, standings] = await Promise.all([
        getTeamInfo(entity.id),
        getTeamSquad(entity.id),
        getTeamFixtures(entity.id),
        getTeamStandings(entity.id),
      ]);
      return { teamInfo, squad, fixtures, standings };
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

    // ADDED: A check to ensure dynamic data was actually found for the test entity
    if (!dynamicData) {
      return NextResponse.json(
        {
          error: `Could not fetch dynamic data for the test entity: ${testEntity.name}. The API may not have data for it.`,
        },
        { status: 404 }
      );
    }

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
      testEntityName: testEntity.name || testEntity.team?.name,
    });
  } catch (error: any) {
    console.error("[SEO Runner Test] Error:", error);
    return NextResponse.json(
      { error: "An error occurred during the test run." },
      { status: 500 }
    );
  }
}
