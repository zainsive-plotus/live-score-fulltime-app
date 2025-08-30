// ===== src/lib/seo-engine.ts =====

import "server-only";
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

// --- Custom Error Classes for Precise Failure Handling ---
export class TemplateNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TemplateNotFoundError";
  }
}
export class DataFetchError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DataFetchError";
  }
}
export class PrimaryContentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PrimaryContentError";
  }
}
export class TranslationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TranslationError";
  }
}

const openai = new OpenAI({ apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY });
const BASE_URL =
  process.env.NEXT_PUBLIC_PUBLIC_APP_URL || "http://localhost:3000";

const BATCH_SIZE = 10;
const BATCH_DELAY_MS = 1500;

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

const getDynamicDataForEntity = async (pageType: string, entityId: string) => {
  switch (pageType) {
    case "league-standings":
      try {
        const { data } = await axios.get(
          `${BASE_URL}/api/standings?league=${entityId}&season=${new Date().getFullYear()}`
        );
        if (!data || !data.league) {
          console.warn(
            `[SEO Engine] No standings data found for league: ${entityId}`
          );
          return null;
        }
        return data;
      } catch (error) {
        console.error(
          `[SEO Engine] Error fetching standings for league: ${entityId}`,
          error
        );
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
        if (!teamInfo) {
          console.warn(
            `[SEO Engine] No team info found for team ID ${entityId}`
          );
          return null;
        }
        return { teamInfo, squad, fixtures, standings };
      } catch (error) {
        console.error(
          `[SEO Engine] Error fetching data for team ID ${entityId}:`,
          error
        );
        return null;
      }
    default:
      return {};
  }
};

// MODIFIED: This function now has a much more robust and precise prompt.
const translateHtmlContent = async (
  html: string,
  sourceLangName: string,
  targetLangName: string,
  retries = 3
): Promise<string> => {
  const systemPrompt =
    "You are an expert multilingual translator specializing in sports content. Your task is to translate HTML content accurately while perfectly preserving all HTML tags.";

  const userPrompt = `
    ### INSTRUCTIONS ###
    1. Translate the user-provided text from the specified SOURCE LANGUAGE to the TARGET LANGUAGE.
    2. Your response MUST be ONLY the translated HTML content.
    3. PRESERVE ALL HTML TAGS, attributes, and structure EXACTLY as they appear in the source.
    4. Only translate the text nodes within the HTML.
    5. Do not add any extra text, explanations, markdown, or code blocks (like \`\`\`html) to your response.

    ### LANGUAGES ###
    - SOURCE LANGUAGE: ${sourceLangName}
    - TARGET LANGUAGE: ${targetLangName}

    ### HTML CONTENT TO TRANSLATE ###
    ${html}
  `;

  for (let i = 0; i < retries; i++) {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.2, // Lower temperature for more deterministic translations
      });
      const translatedHtml = response.choices[0]?.message?.content?.trim();

      if (translatedHtml && translatedHtml.length > 10) {
        return translatedHtml;
      }
      throw new Error(
        "OpenAI returned empty or invalid content for translation."
      );
    } catch (error: any) {
      console.error(
        `[AI Translate Error] Attempt ${
          i + 1
        }/${retries} failed for ${targetLangName}:`,
        error.message
      );
      if (i === retries - 1)
        throw new Error(
          `OpenAI failed to translate to ${targetLangName} after ${retries} attempts.`
        );
      await new Promise((res) => setTimeout(res, 2000 * (i + 1))); // Increased delay for backoff
    }
  }
  throw new Error(
    `Translation to ${targetLangName} failed unexpectedly after all retries.`
  );
};

interface EngineOptions {
  pageType: string;
  entityId: string;
  languages?: string[];
}

interface EngineResult {
  success: boolean;
  message: string;
  processedCount: number;
}

export async function runSeoGenerationForEntity(
  options: EngineOptions
): Promise<EngineResult> {
  const { pageType, entityId, languages: specificLanguages } = options;

  await dbConnect();

  const masterTemplate = await SeoTemplate.findOne({
    pageType,
    language: DEFAULT_LOCALE,
  }).lean();
  if (!masterTemplate) {
    throw new TemplateNotFoundError(
      `Master template for page type '${pageType}' not found.`
    );
  }

  const dynamicData = await getDynamicDataForEntity(pageType, entityId);
  if (!dynamicData) {
    throw new DataFetchError(
      `Could not fetch dynamic API data for entity ID ${entityId}.`
    );
  }

  const variables: Record<string, any> = {};
  masterTemplate.variableMappings.forEach((mapping) => {
    variables[mapping.variable] = evaluateExpression(mapping.path, {
      apiResponse: dynamicData,
    });
  });

  const primarySeoText = populateTemplate(masterTemplate.template, variables);
  if (primarySeoText.includes("[EVAL_ERROR]")) {
    throw new Error("Template evaluation failed. Check variable expressions.");
  }

  await SeoContent.updateOne(
    { pageType, entityId, language: DEFAULT_LOCALE },
    { $set: { seoText: primarySeoText } },
    { upsert: true }
  );

  const allLangs = await Language.find({ isActive: true }).lean();
  const sourceLangDoc = allLangs.find((l) => l.code === DEFAULT_LOCALE);

  if (!sourceLangDoc) {
    throw new Error(
      `Default language '${DEFAULT_LOCALE}' is not configured or inactive.`
    );
  }

  const targetLanguages = specificLanguages
    ? allLangs.filter(
        (l) => specificLanguages.includes(l.code) && l.code !== DEFAULT_LOCALE
      )
    : allLangs.filter((l) => l.code !== DEFAULT_LOCALE);

  if (targetLanguages.length === 0) {
    return {
      success: true,
      message: `Primary content for ${entityId} regenerated. No other languages to translate.`,
      processedCount: 1,
    };
  }

  const sourceContent = primarySeoText;

  const translationPromises = targetLanguages.map(async (targetLang) => {
    try {
      const translatedHtml = await translateHtmlContent(
        sourceContent,
        sourceLangDoc.name,
        targetLang.name
      );
      return {
        updateOne: {
          filter: { pageType, entityId, language: targetLang.code },
          update: { $set: { seoText: translatedHtml } },
          upsert: true,
        },
      };
    } catch (error) {
      console.error(
        `Translation to ${targetLang.name} for ${entityId} failed:`,
        error
      );
      return null;
    }
  });

  const results = await Promise.allSettled(translationPromises);
  const successfulOps = results
    .filter((res) => res.status === "fulfilled" && res.value)
    .map((res) => (res as PromiseFulfilledResult<any>).value);

  if (successfulOps.length > 0) {
    await SeoContent.bulkWrite(successfulOps);
  }

  return {
    success: true,
    message: `Processed ${
      successfulOps.length + 1
    } languages for entity ${entityId}.`,
    processedCount: successfulOps.length + 1,
  };
}
