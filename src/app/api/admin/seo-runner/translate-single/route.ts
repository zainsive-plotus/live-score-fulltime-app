import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/dbConnect";
import SeoContent from "@/models/SeoContent";
import Language from "@/models/Language";
import OpenAI from "openai";
import { DEFAULT_LOCALE } from "@/lib/i18n/config";

const openai = new OpenAI({ apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY });

// --- Helper Function ---
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

// --- Main API Route ---
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

    // 1. Find the source content in the default language
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

    // 2. Get all active languages to translate to
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

    // 3. Loop through target languages, translate, and prepare for saving
    for (const targetLang of targetLanguages) {
      const translatedHtml = await translateHtmlContent(
        sourceContent.seoText,
        sourceLangDoc.name,
        targetLang.name
      );

      bulkOps.push({
        updateOne: {
          filter: { pageType, entityId, language: targetLang.code },
          update: { $set: { seoText: translatedHtml } },
          upsert: true,
        },
      });
      translatedCount++;
    }

    // 4. Save all new translations to the database
    if (bulkOps.length > 0) {
      await SeoContent.bulkWrite(bulkOps);
    }

    return NextResponse.json({
      message: `Successfully translated content for entity ${entityId} into ${translatedCount} language(s).`,
    });
  } catch (error: any) {
    console.error("[SEO Translate Single Error]", error);
    return NextResponse.json(
      { error: "An error occurred while translating content." },
      { status: 500 }
    );
  }
}
