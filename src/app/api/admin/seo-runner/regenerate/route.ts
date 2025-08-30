// ===== src/app/api/admin/seo-runner/regenerate/route.ts =====

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
import {
  getTeamInfo,
  getTeamSquad,
  getTeamFixtures,
  getTeamStandings,
} from "@/lib/data/team";

const openai = new OpenAI({ apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY });
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

const translateHtmlContent = async (
  html: string,
  sourceLangName: string,
  targetLangName: string,
  retries = 3
): Promise<string> => {
  const prompt = `Translate the following HTML content from ${sourceLangName} to ${targetLangName}. Preserve ALL HTML tags exactly as they are. Only translate the text content within the tags. Do not add any extra text, explanations, or markdown. Your response must be only the translated HTML. HTML to translate: \`\`\`html\n${html}\n\`\`\``;
  for (let i = 0; i < retries; i++) {
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
      if (translatedHtml && translatedHtml.length > 10) return translatedHtml;
      throw new Error(
        "OpenAI returned empty or invalid content for translation."
      );
    } catch (error: any) {
      if (i === retries - 1)
        throw new Error(
          `OpenAI failed to translate to ${targetLangName} after ${retries} attempts.`
        );
      await new Promise((res) => setTimeout(res, 1500 * (i + 1)));
    }
  }
  throw new Error(
    `Translation to ${targetLangName} failed unexpectedly after all retries.`
  );
};

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { pageType, entityId, language } = await request.json();
  if (!pageType || !entityId || !language) {
    return NextResponse.json(
      { error: "pageType, entityId, and language are required." },
      { status: 400 }
    );
  }

  try {
    await dbConnect();
    let generatedSeoText: string;

    if (language === DEFAULT_LOCALE) {
      // --- LOGIC FOR PRIMARY LANGUAGE REGENERATION ---
      const masterTemplate = await SeoTemplate.findOne({
        pageType,
        language: DEFAULT_LOCALE,
      }).lean();
      if (!masterTemplate) {
        return NextResponse.json(
          {
            error: `Master template for '${pageType}' not found. Please save a template first.`,
          },
          { status: 404 }
        );
      }

      const dynamicData = await getDynamicDataForEntity(pageType, entityId);
      if (!dynamicData) {
        return NextResponse.json(
          {
            error: `Could not fetch dynamic data for entity ID ${entityId}. The external API may not have data for this item.`,
          },
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

      for (const key in variableMappings) {
        variables[key] = evaluateExpression(variableMappings[key], {
          apiResponse: dynamicData,
        });
      }
      generatedSeoText = populateTemplate(masterTemplate.template, variables);
    } else {
      // --- LOGIC FOR SECONDARY LANGUAGE RE-TRANSLATION ---
      const [sourceContent, languages] = await Promise.all([
        SeoContent.findOne({
          pageType,
          entityId,
          language: DEFAULT_LOCALE,
        }).lean(),
        Language.find({ isActive: true }).lean(),
      ]);

      if (!sourceContent || !sourceContent.seoText) {
        return NextResponse.json(
          {
            error: `Primary content (${DEFAULT_LOCALE}) for entity ${entityId} is missing or empty. Please regenerate it first.`,
          },
          { status: 404 }
        );
      }

      const sourceLangDoc = languages.find((l) => l.code === DEFAULT_LOCALE);
      const targetLangDoc = languages.find((l) => l.code === language);

      if (!sourceLangDoc || !targetLangDoc) {
        return NextResponse.json(
          { error: "Source or target language not found or inactive." },
          { status: 404 }
        );
      }

      try {
        generatedSeoText = await translateHtmlContent(
          sourceContent.seoText,
          sourceLangDoc.name,
          targetLangDoc.name
        );
      } catch (translationError: any) {
        return NextResponse.json(
          {
            error: `AI translation to ${targetLangDoc.name} failed: ${translationError.message}`,
          },
          { status: 500 }
        );
      }
    }

    if (generatedSeoText.includes("[EVAL_ERROR]")) {
      return NextResponse.json(
        {
          error:
            "Failed to regenerate content due to a template variable error. Check your template logic and variable paths.",
        },
        { status: 500 }
      );
    }

    await SeoContent.updateOne(
      { pageType, entityId, language },
      {
        $set: { seoText: generatedSeoText },
        $setOnInsert: { pageType, entityId, language },
      },
      { upsert: true }
    );

    return NextResponse.json({
      message: `Successfully regenerated content for entity ${entityId} (${language.toUpperCase()}).`,
    });
  } catch (error: any) {
    console.error("[API/seo-runner/regenerate] Critical error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred while regenerating content." },
      { status: 500 }
    );
  }
}
