// ===== src/app/api/admin/seo-runner/stream/route.ts =====

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/dbConnect";
import axios from "axios";
import SeoContent from "@/models/SeoContent";
import SeoTemplate from "@/models/SeoTemplate";
import Language from "@/models/Language";
import vm from "vm";
import OpenAI from "openai";
import { DEFAULT_LOCALE } from "@/lib/i18n/config";

const openai = new OpenAI({ apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY });
const BASE_URL =
  process.env.NEXT_PUBLIC_PUBLIC_APP_URL || "http://localhost:3000";

// NEW: Constants for controlling the batch processing
const BATCH_SIZE = 10; // Process 10 leagues at a time
const BATCH_DELAY_MS = 1500; // Wait 1.5 seconds between batches

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
        `${BASE_URL}/api/directory/standings-leagues?limit=10000`
      );
      return data.leagues || [];
    default:
      throw new Error(`Unsupported pageType: ${pageType}`);
  }
};

// MODIFIED: Added more robust error handling
const getDynamicDataForEntity = async (pageType: string, entity: any) => {
  switch (pageType) {
    case "league-standings":
      try {
        const { data } = await axios.get(
          `${BASE_URL}/api/standings?league=${
            entity.id
          }&season=${new Date().getFullYear()}`
        );
        // Gracefully handle cases where the API returns an empty object or no league data
        if (!data || !data.league) {
          console.warn(
            `[SEO Runner] No standings data found for league: ${entity.name} (ID: ${entity.id})`
          );
          return null;
        }
        return data;
      } catch (error) {
        console.error(
          `[SEO Runner] Error fetching standings for league: ${entity.name} (ID: ${entity.id})`,
          error
        );
        return null; // Return null to skip this entity gracefully
      }
    default:
      return {};
  }
};

const translateHtmlContent = async (
  html: string,
  sourceLangName: string,
  targetLangName: string
): Promise<string> => {
  const prompt = `Translate the following HTML content from ${sourceLangName} to ${targetLangName}. Preserve ALL HTML tags exactly as they are. Only translate the text content within the tags. Do not add any extra text, explanations, or markdown. Your response must be only the translated HTML. HTML to translate: \`\`\`html\n${html}\n\`\`\``;
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
    });
    const translatedHtml = response.choices[0]?.message?.content
      ?.trim()
      .replace(/^```(?:html)?\n?|```$/g, "")
      .trim();
    if (!translatedHtml)
      throw new Error("OpenAI returned empty content for translation.");
    return translatedHtml;
  } catch (error) {
    console.error(
      `[AI Translate Error] Failed to translate to ${targetLangName}:`,
      error
    );
    return `<!-- Translation to ${targetLangName} failed --> ${html}`;
  }
};

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    return new Response("Forbidden", { status: 403 });
  }

  try {
    const { pageType, template, variableMappings } = await request.json();
    const sourceLanguage = DEFAULT_LOCALE;

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
          sendEvent("info", { message: "Database connection established." });

          // ... (template saving logic remains the same)
          const variableMappingsForDB = Object.entries(variableMappings).map(
            ([key, value]) => ({ variable: key, path: value as string })
          );
          await SeoTemplate.findOneAndUpdate(
            { pageType, language: sourceLanguage },
            { template, variableMappings: variableMappingsForDB },
            { upsert: true }
          );
          sendEvent("info", {
            message: `Master template for '${pageType}' saved.`,
          });

          sendEvent("info", {
            message: "Fetching list of entities to process...",
          });
          const entities = await getEntitiesForPageType(pageType);
          if (!entities || entities.length === 0) {
            throw new Error(`No entities found for page type: ${pageType}`);
          }
          sendEvent("success", {
            message: `Found ${entities.length} entities. Starting process in batches...`,
          });

          const generatedContentMap = new Map<string, string>();
          let processedCount = 0;

          // NEW: Batch processing loop
          for (let i = 0; i < entities.length; i += BATCH_SIZE) {
            const batch = entities.slice(i, i + BATCH_SIZE);
            sendEvent("progress", {
              total: entities.length,
              current: i,
              stage: `Generating batch ${
                i / BATCH_SIZE + 1
              } for ${sourceLanguage.toUpperCase()}`,
            });

            // CHANGED: Using Promise.allSettled to handle individual failures
            const processingResults = await Promise.allSettled(
              batch.map(async (entity: any) => {
                const entityId = (entity.id || entity.team.id).toString();
                const entityName = entity.name || entity.team.name;

                const dynamicData = await getDynamicDataForEntity(
                  pageType,
                  entity
                );

                // Gracefully skip if no data is returned
                if (!dynamicData) {
                  sendEvent("info", {
                    message: `Skipping ${entityName}: No standings data found.`,
                  });
                  return null;
                }

                const variables: Record<string, any> = {};
                for (const key in variableMappings) {
                  variables[key] = evaluateExpression(variableMappings[key], {
                    apiResponse: dynamicData,
                  });
                }
                const generatedSeoText = populateTemplate(template, variables);
                generatedContentMap.set(entityId, generatedSeoText);

                return {
                  updateOne: {
                    filter: { pageType, entityId, language: sourceLanguage },
                    update: { $set: { seoText: generatedSeoText } },
                    upsert: true,
                  },
                };
              })
            );

            const successfulOps = processingResults
              .filter((result) => result.status === "fulfilled" && result.value)
              .map((result) => (result as PromiseFulfilledResult<any>).value);

            if (successfulOps.length > 0) {
              await SeoContent.bulkWrite(successfulOps);
            }

            processedCount += batch.length;
            sendEvent("progress", {
              total: entities.length,
              current: Math.min(processedCount, entities.length),
              stage: `Generating for ${sourceLanguage.toUpperCase()}`,
            });

            // Add delay between batches
            if (i + BATCH_SIZE < entities.length) {
              await new Promise((res) => setTimeout(res, BATCH_DELAY_MS));
            }
          }

          sendEvent("success", {
            message: `Primary language (${sourceLanguage}) generation complete.`,
          });

          // ... (translation logic can remain the same, as it's less prone to rate limits from OpenAI)
          const allLanguages = await Language.find({ isActive: true }).lean();
          const sourceLangDoc = allLanguages.find(
            (l) => l.code === sourceLanguage
          );
          const targetLanguages = allLanguages.filter(
            (l) => l.code !== sourceLanguage
          );

          if (sourceLangDoc && targetLanguages.length > 0) {
            // Translation logic also updated to use batches for robustness
            for (const targetLang of targetLanguages) {
              sendEvent("progress", {
                total: generatedContentMap.size,
                current: 0,
                stage: `Translating to ${targetLang.code.toUpperCase()}`,
              });
              const translationEntries = Array.from(
                generatedContentMap.entries()
              );
              for (let i = 0; i < translationEntries.length; i += BATCH_SIZE) {
                const batch = translationEntries.slice(i, i + BATCH_SIZE);

                const translationPromises = batch.map(
                  async ([entityId, sourceHtml]) => {
                    try {
                      const translatedHtml = await translateHtmlContent(
                        sourceHtml,
                        sourceLangDoc.name,
                        targetLang.name
                      );
                      return {
                        updateOne: {
                          filter: {
                            pageType,
                            entityId,
                            language: targetLang.code,
                          },
                          update: { $set: { seoText: translatedHtml } },
                          upsert: true,
                        },
                      };
                    } catch (err: any) {
                      sendEvent("error", {
                        message: `Failed to translate entity ${entityId} to ${targetLang.name}: ${err.message}`,
                      });
                      return null;
                    }
                  }
                );

                const translationBulkOps = (
                  await Promise.all(translationPromises)
                ).filter(Boolean);
                if (translationBulkOps.length > 0) {
                  await SeoContent.bulkWrite(translationBulkOps);
                }
                sendEvent("progress", {
                  current: Math.min(i + BATCH_SIZE, generatedContentMap.size),
                  total: generatedContentMap.size,
                  stage: `Translating to ${targetLang.code.toUpperCase()}`,
                });
                if (i + BATCH_SIZE < translationEntries.length) {
                  await new Promise((res) => setTimeout(res, BATCH_DELAY_MS));
                }
              }
              sendEvent("success", {
                message: `Translation for ${targetLang.name} complete.`,
              });
            }
          }

          sendEvent("done", { message: "All tasks completed successfully!" });
          controller.close();
        } catch (error: any) {
          console.error("[SEO Runner Stream] Error:", error.message);
          sendEvent("error", {
            message:
              error.message || "An unknown error occurred during processing.",
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
