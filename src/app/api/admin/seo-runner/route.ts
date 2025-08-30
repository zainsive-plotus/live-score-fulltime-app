// ===== src/app/api/admin/seo-runner/translate-single/route.ts =====

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/dbConnect";
import SeoContent from "@/models/SeoContent";
import Language from "@/models/Language";
import OpenAI from "openai";
import { DEFAULT_LOCALE } from "@/lib/i18n/config";

const openai = new OpenAI({ apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY });

// MODIFIED: Copied the robust translation function from the main runner
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
      if (i === retries - 1) {
        throw new Error(
          `OpenAI failed to translate to ${targetLangName} after ${retries} attempts.`
        );
      }
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

  try {
    const { pageType, entityId } = await request.json();
    if (!pageType || !entityId) {
      return NextResponse.json(
        { error: "pageType and entityId are required." },
        { status: 400 }
      );
    }

    await dbConnect();

    const sourceContent = await SeoContent.findOne({
      pageType,
      entityId,
      language: DEFAULT_LOCALE,
    }).lean();
    if (!sourceContent) {
      return NextResponse.json(
        {
          error: `Primary language content for entity ${entityId} not found. Please generate it first.`,
        },
        { status: 404 }
      );
    }

    const allLanguages = await Language.find({ isActive: true }).lean();
    const sourceLangDoc = allLanguages.find((l) => l.code === DEFAULT_LOCALE);
    const targetLanguages = allLanguages.filter(
      (l) => l.code !== DEFAULT_LOCALE
    );

    if (!sourceLangDoc) {
      return NextResponse.json(
        {
          error: `Default language '${DEFAULT_LOCALE}' not found in the database.`,
        },
        { status: 500 }
      );
    }

    const bulkOps = [];
    let translatedCount = 0;

    // MODIFIED: Using Promise.allSettled for parallel processing and robust error handling
    const translationPromises = targetLanguages.map(async (targetLang) => {
      try {
        const translatedHtml = await translateHtmlContent(
          sourceContent.seoText,
          sourceLangDoc.name,
          targetLang.name
        );

        return {
          status: "fulfilled",
          value: {
            updateOne: {
              filter: { pageType, entityId, language: targetLang.code },
              update: { $set: { seoText: translatedHtml } },
              upsert: true,
            },
          },
        };
      } catch (error) {
        return {
          status: "rejected",
          reason: `Translation to ${targetLang.name} failed.`,
        };
      }
    });

    const results = await Promise.allSettled(translationPromises);

    for (const result of results) {
      if (
        result.status === "fulfilled" &&
        result.value.status === "fulfilled"
      ) {
        bulkOps.push(result.value.value);
        translatedCount++;
      } else if (
        result.status === "rejected" ||
        (result.status === "fulfilled" && result.value.status === "rejected")
      ) {
        const reason =
          result.status === "rejected" ? result.reason : result.value.reason;
        console.error(
          `[Translate Single] A translation promise was rejected:`,
          reason
        );
      }
    }

    if (bulkOps.length > 0) {
      await SeoContent.bulkWrite(bulkOps);
    }

    return NextResponse.json({
      message: `Successfully processed ${translatedCount} of ${targetLanguages.length} possible translations for entity ${entityId}.`,
    });
  } catch (error: any) {
    console.error("[API/seo-runner/translate-single] Critical error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred while translating content." },
      { status: 500 }
    );
  }
}
