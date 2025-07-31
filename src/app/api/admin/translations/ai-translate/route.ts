// ===== src/app/api/admin/translations/ai-translate/route.ts =====

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import OpenAI from "openai";
import Language from "@/models/Language";

const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
});

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const {
      text,
      targetLangCodes,
    }: { text: string; targetLangCodes: string[] } = await request.json();

    if (!text) {
      return NextResponse.json(
        { error: "Text to translate is required." },
        { status: 400 }
      );
    }
    if (!Array.isArray(targetLangCodes) || targetLangCodes.length === 0) {
      return NextResponse.json(
        { error: "An array of target language codes is required." },
        { status: 400 }
      );
    }

    // Fetch language names from the database for better prompt context
    const languages = await Language.find({
      code: { $in: targetLangCodes },
    }).lean();
    const langMap = new Map(languages.map((lang) => [lang.code, lang.name]));

    const targetLanguagesString = targetLangCodes
      .map((code) => langMap.get(code) || code)
      .join(", ");

    const prompt = `
      You are an expert translator specializing in sports and web application UI terminology.
      Translate the following English text into multiple languages.
      
      **Source Text (English):**
      "${text}"

      **Target Languages:**
      ${targetLanguagesString}

      **Instructions:**
      1.  Provide translations for ALL target languages requested.
      2.  Your response MUST be a single, valid JSON object.
      3.  The keys of the JSON object must be the language codes (e.g., "tr", "es").
      4.  The values must be the translated strings.
      5.  Maintain the original meaning, tone, and any placeholders like {variable}.
      6.  Do NOT include any explanations, markdown, or text outside of the JSON object.
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("OpenAI response was empty.");
    }

    const translations = JSON.parse(content);

    // Ensure all requested languages are present, even if AI fails for some
    const finalTranslations: { [key: string]: string } = {};
    targetLangCodes.forEach((code) => {
      finalTranslations[code] = translations[code] || ""; // Default to empty string if missing
    });

    return NextResponse.json(finalTranslations, { status: 200 });
  } catch (error: any) {
    console.error("[API/admin/translations/ai-translate] Error:", error);
    return NextResponse.json(
      { error: "Failed to generate AI translations." },
      { status: 500 }
    );
  }
}
