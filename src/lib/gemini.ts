// ===== src/lib/gemini.ts =====

import "server-only";
import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

if (!API_KEY) {
  console.warn(
    "[Gemini Service] GOOGLE_GEMINI_API_KEY is not configured. Gemini translations will be unavailable."
  );
}

const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;
const model = genAI
  ? genAI.getGenerativeModel({ model: "gemini-2.5-flash" })
  : null;

// A robust, structured prompt specifically for Gemini
export const translatePostWithGemini = async (
  post: {
    title: string;
    content: string;
    metaTitle?: string;
    metaDescription?: string;
  },
  sourceLangName: string,
  targetLangName: string
): Promise<{
  title: string;
  content: string;
  metaTitle: string;
  metaDescription: string;
}> => {
  if (!model) {
    throw new Error("Gemini AI model is not initialized. Check API Key.");
  }

  const prompt = `
    ### TASK ###
    You are an expert multilingual translator for a sports news website. Your task is to translate a news article from a source language to a target language.

    ### RULES ###
    1.  Your response MUST be a single, valid JSON object. Do not include any text, explanations, or markdown code fences (like \`\`\`json) outside of the JSON object.
    2.  The JSON object must contain these exact keys: "title", "content", "metaTitle", "metaDescription".
    3.  Preserve ALL HTML TAGS in the 'content' field exactly as they are. Only translate the text within the tags.
    4.  The 'metaTitle' should be an SEO-optimized, engaging headline around 50-60 characters.
    5.  The 'metaDescription' should be a compelling summary around 150-160 characters.

    ### LANGUAGES ###
    - SOURCE LANGUAGE: ${sourceLangName}
    - TARGET LANGUAGE: ${targetLangName}

    ### CONTENT TO TRANSLATE (JSON) ###
    ${JSON.stringify(
      {
        title: post.title,
        content: post.content,
        metaTitle: post.metaTitle || post.title,
        metaDescription: post.metaDescription || "",
      },
      null,
      2
    )}
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Clean the response to ensure it's valid JSON
    const cleanedText = text.replace(/^```json\n?|```$/g, "").trim();

    const parsed = JSON.parse(cleanedText);

    if (!parsed.title || !parsed.content) {
      throw new Error(
        "Gemini response was missing required JSON fields (title, content)."
      );
    }

    return parsed;
  } catch (error: any) {
    console.error(
      `[Gemini Translate Error] Failed to translate to ${targetLangName}:`,
      error.message
    );
    throw new Error(`Gemini translation to ${targetLangName} failed.`);
  }
};
