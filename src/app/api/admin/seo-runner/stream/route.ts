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

// --- Helper Functions ---

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
      return data.leagues || data;
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

// --- Main Streaming Route ---

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    return new Response("Forbidden", { status: 403 });
  }

  try {
    const { pageType, template, variableMappings } = await request.json();
    const sourceLanguage = DEFAULT_LOCALE;

    // Create a stream for Server-Sent Events
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

          // 1. Save Master Template
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

          // 2. Fetch Entities
          sendEvent("info", {
            message: "Fetching list of entities to process...",
          });
          const entities = await getEntitiesForPageType(pageType);
          if (!entities || entities.length === 0) {
            throw new Error(`No entities found for page type: ${pageType}`);
          }
          sendEvent("success", {
            message: `Found ${entities.length} entities.`,
          });
          sendEvent("progress", {
            total: entities.length,
            current: 0,
            stage: `Generating for ${sourceLanguage.toUpperCase()}`,
          });

          // 3. Process Primary Language
          const generatedContentMap = new Map<string, string>();
          for (let i = 0; i < entities.length; i++) {
            const entity = entities[i];
            const entityId = (entity.id || entity.team.id).toString();
            const entityName = entity.name || entity.team.name;

            sendEvent("info", {
              message: `[${i + 1}/${
                entities.length
              }] Processing: ${entityName}`,
            });
            const dynamicData = await getDynamicDataForEntity(pageType, entity);
            const variables: Record<string, any> = {};
            for (const key in variableMappings) {
              variables[key] = evaluateExpression(variableMappings[key], {
                apiResponse: dynamicData,
              });
            }
            const generatedSeoText = populateTemplate(template, variables);
            generatedContentMap.set(entityId, generatedSeoText);

            await SeoContent.updateOne(
              { pageType, entityId, language: sourceLanguage },
              { $set: { seoText: generatedSeoText } },
              { upsert: true }
            );
            sendEvent("progress", {
              total: entities.length,
              current: i + 1,
              stage: `Generating for ${sourceLanguage.toUpperCase()}`,
            });
          }
          sendEvent("success", {
            message: `Primary language (${sourceLanguage}) generation complete.`,
          });

          // 4. Process Translations
          const allLanguages = await Language.find({ isActive: true }).lean();
          const sourceLangDoc = allLanguages.find(
            (l) => l.code === sourceLanguage
          );
          const targetLanguages = allLanguages.filter(
            (l) => l.code !== sourceLanguage
          );

          if (sourceLangDoc && targetLanguages.length > 0) {
            sendEvent("info", {
              message: `Starting translation for ${targetLanguages.length} other languages.`,
            });
            for (const targetLang of targetLanguages) {
              sendEvent("progress", {
                total: entities.length,
                current: 0,
                stage: `Translating to ${targetLang.code.toUpperCase()}`,
              });
              let translatedCount = 0;
              for (const [
                entityId,
                sourceHtml,
              ] of generatedContentMap.entries()) {
                const translatedHtml = await translateHtmlContent(
                  sourceHtml,
                  sourceLangDoc.name,
                  targetLang.name
                );
                await SeoContent.updateOne(
                  { pageType, entityId, language: targetLang.code },
                  { $set: { seoText: translatedHtml } },
                  { upsert: true }
                );
                translatedCount++;
                sendEvent("progress", {
                  total: entities.length,
                  current: translatedCount,
                  stage: `Translating to ${targetLang.code.toUpperCase()}`,
                });
              }
              sendEvent("success", {
                message: `Translation for ${targetLang.name} complete.`,
              });
            }
          }

          sendEvent("done", { message: "All tasks completed successfully!" });
          controller.close();
        } catch (error: any) {
          console.error("[SEO Runner Stream Error]", error);
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
