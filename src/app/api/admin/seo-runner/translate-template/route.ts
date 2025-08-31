// ===== src/app/api/admin/seo-runner/translate-template/route.ts =====

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY });

// This robust translation function is the core of this endpoint.
const translateHtmlContent = async (
  html: string,
  sourceLangName: string,
  targetLangName: string,
  retries = 3
): Promise<string> => {
  const systemPrompt =
    "You are an expert multilingual translator specializing in sports content. Your task is to translate HTML content accurately while perfectly preserving all HTML tags and variable placeholders like {variable_name}.";

  const userPrompt = `
    ### INSTRUCTIONS ###
    1. Translate the user-provided text from the specified SOURCE LANGUAGE to the TARGET LANGUAGE.
    2. Your response MUST be ONLY the translated HTML content.
    3. PRESERVE ALL HTML TAGS, attributes, and structure EXACTLY as they appear in the source.
    4. PRESERVE ALL variable placeholders (e.g., {teamName}, {season}) EXACTLY as they are. DO NOT translate the text inside the curly braces.
    5. Only translate the text nodes within the HTML.
    6. Do not add any extra text, explanations, markdown, or code blocks (like \`\`\`html) to your response.

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
        temperature: 0.2,
      });
      const translatedHtml = response.choices[0]?.message?.content?.trim();
      if (translatedHtml && translatedHtml.length > 10) return translatedHtml;
      throw new Error(
        "OpenAI returned empty or invalid content for translation."
      );
    } catch (error: any) {
      console.error(
        `[AI Translate Template Error] Attempt ${
          i + 1
        }/${retries} failed for ${targetLangName}:`,
        error.message
      );
      if (i === retries - 1)
        throw new Error(
          `OpenAI failed to translate template to ${targetLangName} after ${retries} attempts.`
        );
      await new Promise((res) => setTimeout(res, 2000 * (i + 1)));
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
    const {
      template,
      sourceLang,
      targetLangs,
    }: {
      template: string;
      sourceLang: string;
      targetLangs: { code: string; name: string }[];
    } = await request.json();

    if (
      !template ||
      !sourceLang ||
      !Array.isArray(targetLangs) ||
      targetLangs.length === 0
    ) {
      return NextResponse.json(
        {
          error:
            "A template, source language, and an array of target languages are required.",
        },
        { status: 400 }
      );
    }

    // Use Promise.all to translate to all languages concurrently
    const translationPromises = targetLangs.map((targetLang) =>
      translateHtmlContent(template, sourceLang, targetLang.name)
        .then((translatedText) => ({
          status: "fulfilled",
          code: targetLang.code,
          text: translatedText,
        }))
        .catch((error) => ({
          status: "rejected",
          code: targetLang.code,
          error: error.message,
        }))
    );

    const results = await Promise.all(translationPromises);

    const translations: Record<string, string> = {};
    let failures = 0;

    results.forEach((result) => {
      if (result.status === "fulfilled") {
        translations[result.code] = result.text;
      } else {
        console.error(
          `Failed to translate for language code ${result.code}: ${result.error}`
        );
        failures++;
      }
    });

    if (failures > 0) {
      console.warn(`${failures} language(s) failed to translate.`);
    }

    return NextResponse.json({ translations });
  } catch (error: any) {
    console.error("[API/translate-template] Critical error:", error);
    return NextResponse.json(
      {
        error: "An unexpected error occurred while translating the templates.",
      },
      { status: 500 }
    );
  }
}
