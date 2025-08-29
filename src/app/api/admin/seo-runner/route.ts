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

const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
});

const BASE_URL =
  process.env.NEXT_PUBLIC_PUBLIC_APP_URL || "http://localhost:3000";

// Helper Functions
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
      return data.leagues || data; // Handle both direct array and object with 'leagues' key
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

// --- MAIN API ROUTE ---
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { pageType, template, variableMappings, translate } =
      await request.json();
    const sourceLanguage = DEFAULT_LOCALE;

    if (!pageType || !template) {
      return NextResponse.json(
        { error: "pageType and template are required." },
        { status: 400 }
      );
    }

    await dbConnect();

    const variableMappingsForDB = Object.entries(variableMappings).map(
      ([key, value]) => ({ variable: key, path: value as string })
    );
    await SeoTemplate.findOneAndUpdate(
      { pageType, language: sourceLanguage },
      { template, variableMappings: variableMappingsForDB },
      { upsert: true, new: true, runValidators: true }
    );

    const entities = await getEntitiesForPageType(pageType);
    if (!entities || entities.length === 0) {
      return NextResponse.json(
        { error: `No entities found for page type: ${pageType}` },
        { status: 404 }
      );
    }

    const primaryLanguageBulkOps = [];
    const generatedContentMap = new Map<string, string>();

    for (const entity of entities) {
      const dynamicData = await getDynamicDataForEntity(pageType, entity);
      const variables: Record<string, any> = {};
      for (const key in variableMappings) {
        variables[key] = evaluateExpression(variableMappings[key], {
          apiResponse: dynamicData,
        });
      }
      const generatedSeoText = populateTemplate(template, variables);
      const entityId = (entity.id || entity.team.id).toString();

      generatedContentMap.set(entityId, generatedSeoText);

      primaryLanguageBulkOps.push({
        updateOne: {
          filter: { pageType, entityId, language: sourceLanguage },
          update: { $set: { seoText: generatedSeoText } },
          upsert: true,
        },
      });
    }

    if (primaryLanguageBulkOps.length > 0) {
      await SeoContent.bulkWrite(primaryLanguageBulkOps);
    }

    let translatedLanguagesCount = 0;
    if (translate) {
      const allLanguages = await Language.find({ isActive: true }).lean();
      const sourceLangDoc = allLanguages.find((l) => l.code === sourceLanguage);
      const targetLanguages = allLanguages.filter(
        (l) => l.code !== sourceLanguage
      );

      if (sourceLangDoc && targetLanguages.length > 0) {
        for (const targetLang of targetLanguages) {
          console.log(
            `[SEO Runner] Translating content to ${targetLang.name}...`
          );
          const translationBulkOps = [];
          for (const [entityId, sourceHtml] of generatedContentMap.entries()) {
            const translatedHtml = await translateHtmlContent(
              sourceHtml,
              sourceLangDoc.name,
              targetLang.name
            );
            translationBulkOps.push({
              updateOne: {
                filter: { pageType, entityId, language: targetLang.code },
                update: { $set: { seoText: translatedHtml } },
                upsert: true,
              },
            });
          }
          if (translationBulkOps.length > 0) {
            await SeoContent.bulkWrite(translationBulkOps);
            translatedLanguagesCount++;
          }
        }
      }
    }

    let message = `Successfully processed ${entities.length} pages for the primary language ('${sourceLanguage}').`;
    if (translate && translatedLanguagesCount > 0) {
      message += ` Auto-translated into ${translatedLanguagesCount} other language(s).`;
    }

    return NextResponse.json({ message, processedCount: entities.length });
  } catch (error: any) {
    console.error("[SEO Runner Error]", error);
    return NextResponse.json(
      { error: "An error occurred while running the SEO generator." },
      { status: 500 }
    );
  }
}
