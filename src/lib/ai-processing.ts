// ===== src/lib/ai-processing.ts =====

import "server-only";
import dbConnect from "@/lib/dbConnect";
import ExternalNewsArticle, {
  IExternalNewsArticle,
} from "@/models/ExternalNewsArticle";
import Post from "@/models/Post";
import AIJournalist from "@/models/AIJournalist";
import Language from "@/models/Language";
import slugify from "slugify";
import mongoose from "mongoose";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
});

async function paraphraseSnippet(
  originalTitle: string,
  originalDescription: string,
  journalistName: string
): Promise<{ newTitle: string; newDescription: string }> {
  const prompt = `
    You are an expert Turkish sports journalist named "${journalistName}".
    Your task is to rewrite the given title and description to be more engaging, humanized, and SEO-friendly, as if you were writing a short summary for your own news site.
    GUIDELINES:
    1.  **Language:** All output MUST be in Turkish.
    2.  **Format:** Your entire response MUST be a single, valid JSON object with two keys: "newTitle" and "newDescription".
    3.  **Paraphrase Heavily:** Do not just translate. Completely rephrase the title and description to make them unique.
    4.  **Content:** The 'newDescription' should be a concise, compelling summary of 1-3 sentences.
    CONTEXT:
    - Original Title: "${originalTitle}"
    - Original Description: "${originalDescription}"
    YOUR RESPONSE (JSON object only):
  `;
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7,
    response_format: { type: "json_object" },
  });
  const content = response.choices[0]?.message?.content;
  if (!content)
    throw new Error("OpenAI response was empty for paraphraseSnippet.");
  try {
    const parsed = JSON.parse(content);
    if (!parsed.newTitle || !parsed.newDescription)
      throw new Error(
        "AI response was missing required JSON fields for paraphraseSnippet."
      );
    return parsed;
  } catch (e) {
    console.error(
      "Failed to parse JSON from OpenAI paraphraseSnippet:",
      content,
      e
    );
    throw new Error("AI failed to generate a valid paraphrase object.");
  }
}

async function translateTextWithRetry(
  text: string,
  targetLanguage: string,
  retries = 3
): Promise<string> {
  const prompt = `Translate the following text into ${targetLanguage}. Return ONLY the translated text, without any quotes, labels, or extra formatting. TEXT TO TRANSLATE: "${text}"`;

  for (let i = 0; i < retries; i++) {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2,
      });
      const translatedText = response.choices[0]?.message?.content
        ?.trim()
        .replace(/["']/g, "");
      if (!translatedText)
        throw new Error("Empty response from OpenAI for translation.");
      return translatedText;
    } catch (error: any) {
      console.error(
        `Attempt ${i + 1} failed for translating to ${targetLanguage}:`,
        error.message
      );
      if (i === retries - 1) {
        throw new Error(
          `OpenAI failed to translate text to ${targetLanguage} after ${retries} attempts.`
        );
      }
      await new Promise((res) => setTimeout(res, 1500 * (i + 1)));
    }
  }
  throw new Error(`Translation to ${targetLanguage} failed unexpectedly.`);
}

export async function processSingleArticle(
  externalArticle: IExternalNewsArticle,
  options: { onProgress?: (log: string) => void } = {}
): Promise<{ success: boolean; primaryPostId?: string }> {
  const { onProgress = () => {} } = options;
  try {
    await dbConnect();

    const lockedArticle = await ExternalNewsArticle.findOneAndUpdate(
      { _id: externalArticle._id, status: "fetched" },
      { $set: { status: "processing" } },
      { new: false }
    );

    if (!lockedArticle) {
      onProgress(
        `Article "${externalArticle.title}" is already being processed or is in a final state. Skipping.`
      );
      return { success: true };
    }

    onProgress("Fetching languages and default AI journalist...");
    const allActiveLanguages = await Language.find({ isActive: true }).lean();
    const defaultJournalist = await AIJournalist.findOne({
      isActive: true,
    }).sort({ createdAt: 1 });

    if (!defaultJournalist) throw new Error("No active AI Journalist found.");
    if (allActiveLanguages.length === 0)
      throw new Error("No active languages found.");
    onProgress(`-> Using journalist: ${defaultJournalist.name}`);

    onProgress("Paraphrasing article in primary language (Turkish)...");
    const { newTitle, newDescription } = await paraphraseSnippet(
      externalArticle.title,
      externalArticle.content ||
        externalArticle.description ||
        externalArticle.title,
      defaultJournalist.name
    );
    onProgress(`-> Generated Title: "${newTitle}"`);

    const primaryLanguageCode = "tr";
    const slug = slugify(newTitle, { lower: true, strict: true });
    const existingPost = await Post.findOne({
      slug,
      language: primaryLanguageCode,
    });
    const finalSlug = existingPost
      ? `${slug}-${Date.now().toString().slice(-5)}`
      : slug;

    onProgress("Saving primary Turkish article...");

    const primaryPost = new Post({
      title: newTitle,
      content: `<p>${newDescription}</p>`,
      slug: finalSlug,
      author: defaultJournalist.name,
      featuredImage: externalArticle.imageUrl,
      language: primaryLanguageCode,
      translationGroupId: new mongoose.Types.ObjectId(),
      isAIGenerated: true,
      status: "published",
      newsType: "recent",
      sportsCategory: ["general", "football"],
      originalSourceUrl: externalArticle.link,
      metaTitle: newTitle,
      metaDescription: newDescription,
    });

    await primaryPost.save();
    onProgress("-> Primary article saved.");

    const otherLanguages = allActiveLanguages.filter(
      (lang) => lang.code !== primaryLanguageCode
    );
    onProgress(
      `Found ${otherLanguages.length} other languages to translate to...`
    );

    const translationPromises = otherLanguages.map((lang) =>
      Promise.all([
        translateTextWithRetry(newTitle, lang.name),
        translateTextWithRetry(newDescription, lang.name),
      ])
        .then(([translatedTitle, translatedContent]) => ({
          status: "fulfilled",
          value: { lang, translatedTitle, translatedContent },
        }))
        .catch((error) => ({ status: "rejected", reason: { lang, error } }))
    );

    const results = await Promise.all(translationPromises);

    for (const result of results) {
      if (result.status === "fulfilled") {
        const { lang, translatedTitle, translatedContent } = result.value;
        onProgress(`-- Translating to ${lang.name}...`);
        const translatedSlug = slugify(translatedTitle, {
          lower: true,
          strict: true,
        });
        const translatedPost = new Post({
          ...primaryPost.toObject(),
          _id: new mongoose.Types.ObjectId(),
          isNew: true,
          title: translatedTitle,
          content: `<p>${translatedContent}</p>`,
          slug: translatedSlug,
          language: lang.code,
          translationGroupId: primaryPost.translationGroupId,
          metaTitle: translatedTitle,
          metaDescription: translatedContent,
        });
        await translatedPost.save();
        onProgress(`-- ✓ Saved ${lang.name} translation.`);
      } else {
        const { lang, error } = result.reason;
        onProgress(
          `-- ✗ Failed to translate to ${lang.name}: ${error.message}`
        );
      }
    }

    await ExternalNewsArticle.updateOne(
      { _id: externalArticle._id },
      {
        $set: { status: "processed", processedPostId: primaryPost._id },
      }
    );

    onProgress(
      `✓ Successfully processed and translated article for group ${primaryPost.translationGroupId}`
    );
    return { success: true, primaryPostId: primaryPost._id.toString() };
  } catch (error: any) {
    onProgress(`✗ ERROR: ${error.message}`);

    await ExternalNewsArticle.updateOne(
      { _id: externalArticle._id, status: "processing" },
      { $set: { status: "error" } }
    );
    return { success: false };
  }
}
