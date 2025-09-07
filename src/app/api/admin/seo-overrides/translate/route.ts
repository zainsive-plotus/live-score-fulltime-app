// ===== src/app/api/admin/seo-overrides/translate/route.ts =====

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import OpenAI from "openai";
import { ILanguage } from "@/models/Language";

const openai = new OpenAI({ apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY });

interface TranslationPayload {
  metaTitle: string;
  metaDescription: string;
  seoText: string;
}

const translateContent = async (
  content: TranslationPayload,
  sourceLangName: string,
  targetLangName: string
): Promise<TranslationPayload> => {
  const systemPrompt =
    "You are an expert multilingual translator specializing in high-quality, SEO-optimized web content for a sports website. Your task is to translate all provided fields accurately while preserving HTML structure and adhering to SEO best practices.";

  const userPrompt = `
    ### INSTRUCTIONS ###
    1. Translate all text fields from the SOURCE LANGUAGE to the TARGET LANGUAGE.
    2. Your response MUST be a single, valid JSON object. Do not include any text outside of the JSON.
    3. The JSON object must have these exact keys: "metaTitle", "metaDescription", "seoText".
    4. PRESERVE ALL HTML TAGS in the 'seoText' field exactly as they are. Only translate the text within the tags.
    5. Ensure the translated 'metaTitle' is SEO-friendly and between 50-60 characters.
    6. Ensure the translated 'metaDescription' is a compelling summary between 150-160 characters.
    7. Maintain an engaging and professional tone.

    ### LANGUAGES ###
    - SOURCE LANGUAGE: ${sourceLangName}
    - TARGET LANGUAGE: ${targetLangName}

    ### CONTENT TO TRANSLATE (JSON) ###
    ${JSON.stringify(content, null, 2)}
  `;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.3,
      response_format: { type: "json_object" },
    });

    const responseContent = response.choices[0]?.message?.content;
    if (!responseContent) {
      throw new Error("OpenAI response was empty.");
    }

    const parsed = JSON.parse(responseContent);
    if (!parsed.metaTitle || !parsed.metaDescription || !parsed.seoText) {
      throw new Error("AI response was missing required JSON fields.");
    }

    return parsed;
  } catch (error: any) {
    console.error(
      `[AI Translate SEO Override Error] Failed to translate to ${targetLangName}:`,
      error.message
    );
    throw new Error(`AI translation to ${targetLangName} failed.`);
  }
};

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const {
      sourceContent,
      sourceLang,
      targetLangs,
    }: {
      sourceContent: TranslationPayload;
      sourceLang: string;
      targetLangs: ILanguage[];
    } = await request.json();

    if (
      !sourceContent ||
      !sourceLang ||
      !Array.isArray(targetLangs) ||
      targetLangs.length === 0
    ) {
      return NextResponse.json(
        {
          error:
            "sourceContent, sourceLang, and targetLangs array are required.",
        },
        { status: 400 }
      );
    }

    const translationPromises = targetLangs.map((targetLang) =>
      translateContent(sourceContent, sourceLang, targetLang.name)
        .then((translatedText) => ({
          status: "fulfilled",
          code: targetLang.code,
          data: translatedText,
        }))
        .catch((error) => ({
          status: "rejected",
          code: targetLang.code,
          error: error.message,
        }))
    );

    const results = await Promise.all(translationPromises);

    const translations: Record<string, TranslationPayload> = {};
    let failures = 0;

    results.forEach((result) => {
      if (result.status === "fulfilled") {
        translations[result.code] = result.data;
      } else {
        console.error(
          `Failed to translate for language code ${result.code}: ${result.error}`
        );
        failures++;
      }
    });

    if (failures > 0) {
      toast.error(
        `${failures} language(s) failed to translate. Check the server console.`
      );
    }

    return NextResponse.json({ translations });
  } catch (error: any) {
    console.error("[API/seo-overrides/translate] Critical error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred while translating content." },
      { status: 500 }
    );
  }
}
