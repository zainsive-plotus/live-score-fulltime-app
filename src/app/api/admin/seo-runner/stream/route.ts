// ===== src/app/api/admin/seo-runner/stream/route.ts =====

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/dbConnect";
import axios from "axios";
import SeoContent from "@/models/SeoContent";
import SeoTemplate from "@/models/SeoTemplate";
import vm from "vm";
import {
  getTeamInfo,
  getTeamSquad,
  getTeamFixtures,
  getTeamStandings,
} from "@/lib/data/team";
import { DEFAULT_LOCALE } from "@/lib/i18n/config";

const BASE_URL =
  process.env.NEXT_PUBLIC_PUBLIC_APP_URL || "http://localhost:3000";

const BATCH_DELAY_MS = 500; // Delay between processing each entity

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

const populateTemplate = (template: string, variables: Record<string, any>) => {
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
      const { data: leagueData } = await axios.get(
        `${BASE_URL}/api/directory/standings-leagues?limit=10000`
      );
      return leagueData.leagues || [];
    case "team-details":
      const { data: teamData } = await axios.get(
        `${BASE_URL}/api/directory/teams-all`
      );
      return teamData || [];
    default:
      throw new Error(`Unsupported pageType: ${pageType}`);
  }
};

const getDynamicDataForEntity = async (pageType: string, entityId: string) => {
  switch (pageType) {
    case "league-standings":
      try {
        const { data } = await axios.get(
          `${BASE_URL}/api/standings?league=${entityId}&season=${new Date().getFullYear()}`
        );
        if (!data || !data.league) return null;
        return data;
      } catch (error) {
        return null;
      }
    case "team-details":
      try {
        const [teamInfo, squad, fixtures, standings] = await Promise.all([
          getTeamInfo(entityId),
          getTeamSquad(entityId),
          getTeamFixtures(entityId),
          getTeamStandings(entityId),
        ]);
        if (!teamInfo) return null;
        return { teamInfo, squad, fixtures, standings };
      } catch (error) {
        return null;
      }
    default:
      return {};
  }
};

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    return new Response("Forbidden", { status: 403 });
  }

  try {
    const { pageType } = await request.json();

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        const sendEvent = (type: string, data: any) => {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type, ...data })}\n\n`)
          );
        };

        try {
          await dbConnect();
          sendEvent("info", {
            message: `Starting batch process for page type: ${pageType}`,
          });

          // STEP 1: Fetch ALL pre-translated templates for every language from the database.
          const allTemplates = await SeoTemplate.find({ pageType }).lean();
          const masterTemplate = allTemplates.find(
            (t) => t.language === DEFAULT_LOCALE
          );

          if (!masterTemplate) {
            throw new Error(
              `Master template for '${pageType}' in ${DEFAULT_LOCALE.toUpperCase()} language not found. Please create it and define variables there first.`
            );
          }
          sendEvent("success", {
            message: `Found ${allTemplates.length} language templates to use.`,
          });

          const entities = await getEntitiesForPageType(pageType);
          if (!entities || entities.length === 0) {
            throw new Error(`No entities found for page type: ${pageType}`);
          }
          sendEvent("success", {
            message: `Found ${entities.length} entities to process.`,
          });

          let successCount = 0;
          let failureCount = 0;

          for (let i = 0; i < entities.length; i++) {
            const entity = entities[i];
            const entityId = (entity.id || entity.team?.id).toString();
            const entityName = entity.name || entity.team?.name;

            sendEvent("progress", {
              total: entities.length,
              current: i + 1,
              stage: `Processing: ${entityName}`,
            });

            try {
              // STEP 2: Fetch the dynamic API data for the entity just ONCE.
              const dynamicData = await getDynamicDataForEntity(
                pageType,
                entityId
              );
              if (!dynamicData) {
                throw new Error(
                  `Could not fetch API data for ${entityName}. Skipping.`
                );
              }

              // STEP 3: Evaluate the variables using the mappings from the master (TR) template.
              const variables: Record<string, any> = {};
              masterTemplate.variableMappings.forEach((mapping) => {
                variables[mapping.variable] = evaluateExpression(mapping.path, {
                  apiResponse: dynamicData,
                });
              });

              if (Object.values(variables).some((v) => v === "[EVAL_ERROR]")) {
                throw new Error(
                  `Template variable evaluation failed for ${entityName}.`
                );
              }

              // STEP 4: Loop through each pre-translated template and inject the variables.
              const bulkOps = allTemplates.map((template) => {
                const seoText = populateTemplate(template.template, variables);
                return {
                  updateOne: {
                    filter: { pageType, entityId, language: template.language },
                    update: { $set: { seoText } },
                    upsert: true,
                  },
                };
              });

              // STEP 5: Save all generated language versions for this entity in one database operation.
              if (bulkOps.length > 0) {
                await SeoContent.bulkWrite(bulkOps);
              }

              sendEvent("success", {
                message: `✓ Successfully processed ${entityName} for ${allTemplates.length} languages.`,
              });
              successCount++;
            } catch (error: any) {
              sendEvent("error", {
                message: `✗ Failed to process ${entityName}: ${error.message}`,
              });
              failureCount++;
            }

            if (i < entities.length - 1) {
              await new Promise((res) => setTimeout(res, BATCH_DELAY_MS));
            }
          }

          sendEvent("done", {
            message: `Batch complete. Succeeded: ${successCount}, Failed: ${failureCount}.`,
          });
          controller.close();
        } catch (error: any) {
          console.error("[SEO Runner Stream] Critical Error:", error.message);
          sendEvent("error", {
            message: `A critical error occurred: ${error.message}`,
          });
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to start runner stream." },
      { status: 500 }
    );
  }
}
