import mongoose, { Schema, Document, Model } from "mongoose";
import OpenAI from "openai";
import "dotenv/config";

// --- CONFIGURATION: REPLACE WITH YOUR ACTUAL CREDENTIALS ---
const MONGO_URI = "";
const OPENAI_API_KEY = "";

// ---------------------------------------------------------

// --- TARGET DATA ---
const TARGET_TRANSLATION_KEYS = [
  "author_default_page_title",
  "author_default_page_description",
  "contact_us_meta_title",
  "contact_us_meta_description",
  "faq_meta_title",
  "faq_meta_description",
  "gdpr_default_page_title",
  "gdpr_default_page_description",
  "privacy_policy_default_page_title",
  "privacy_policy_default_page_description",
  "report_abuse_default_page_title",
  "report_abuse_default_page_description",
  "terms_and_conditions_default_title",
  "terms_and_conditions_default_desc",
  "leagues_page_meta_title",
  "leagues_page_meta_description",
  "news_page_meta_title",
  "news_page_meta_description",
  "highlights_page_meta_title",
  "highlights_page_meta_description",
  "predictions_page_meta_title",
  "predictions_page_meta_description",
  "standings_hub_page_title",
  "standings_hub_page_description",
  "teams_page_meta_title",
  "teams_page_meta_description",
];
const TARGET_LANGUAGE_CODES = ["it", "fr", "zu", "es"];
// -------------------

// --- SELF-CONTAINED SETUP ---
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

// Mongoose Language Model
interface ILanguage extends Document {
  name: string;
  code: string;
}
const LanguageSchema: Schema<ILanguage> = new Schema({
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true },
});
const Language: Model<ILanguage> =
  mongoose.models.Language ||
  mongoose.model<ILanguage>("Language", LanguageSchema);

// Mongoose Translation Model
interface ITranslation extends Document {
  key: string;
  translations: Map<string, string>;
}
const TranslationSchema: Schema<ITranslation> = new Schema({
  key: { type: String, required: true, unique: true },
  translations: { type: Map, of: String, required: true },
});
const Translation: Model<ITranslation> =
  mongoose.models.Translation ||
  mongoose.model<ITranslation>("Translation", TranslationSchema);
// --------------------------

/**
 * Fetches translations for a given English text into multiple target languages using OpenAI.
 * @param sourceText The English text to translate.
 * @param languages A map of language codes to full language names.
 * @returns A promise that resolves to a record of language codes and their translations.
 */
async function getAiTranslations(
  sourceText: string,
  languages: Map<string, string>
): Promise<Record<string, string>> {
  const targetLanguagesString = Array.from(languages.entries())
    .map(([code, name]) => `${name} ('${code}')`)
    .join(", ");

  const prompt = `
    You are an expert SEO translator. Translate the following English text into multiple languages for a sports media website's metadata.

    **Source Text (English):**
    "${sourceText}"

    **Target Languages:**
    ${targetLanguagesString}

    **Instructions:**
    1. Provide high-quality, natural-sounding translations.
    2. Your response MUST be a single, valid JSON object.
    3. The keys of the JSON object must be the language codes (e.g., "it", "fr").
    4. The values must be the translated strings.
    5. Do NOT include any explanations, markdown, or text outside the JSON object.
  `;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.5,
      response_format: { type: "json_object" },
    });
    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error("OpenAI response was empty.");
    return JSON.parse(content);
  } catch (error) {
    console.error("Error during OpenAI API call:", error);
    throw new Error("Failed to get translations from AI.");
  }
}

/**
 * Main script execution function.
 */
async function main() {
  console.log("Connecting to the database...");
  await mongoose.connect(MONGO_URI);
  console.log("Database connected successfully.");

  let successCount = 0;
  let failedCount = 0;

  try {
    console.log("Fetching all pages and active languages...");
    const [translationDocs, languageDocs] = await Promise.all([
      Translation.find({ key: { $in: TARGET_TRANSLATION_KEYS } }),
      Language.find({ code: { $in: TARGET_LANGUAGE_CODES } }).lean(),
    ]);

    const languageMap = new Map(
      languageDocs.map((lang) => [lang.code, lang.name])
    );

    console.log(
      `Found ${translationDocs.length} pages and ${languageDocs.length} languages to process.`
    );
    console.log("------------------------------------------");

    for (const doc of translationDocs) {
      console.log(`Processing key: ${doc.key}`);
      try {
        const sourceText = doc.translations.get("en");

        if (!sourceText) {
          console.log(
            "  - Skipping: No English (en) source translation found."
          );
          failedCount++;
          continue;
        }

        console.log(`  -> Translating from English: "${sourceText}"`);
        const newTranslations = await getAiTranslations(
          sourceText,
          languageMap
        );

        let updated = false;
        for (const langCode of TARGET_LANGUAGE_CODES) {
          if (newTranslations[langCode]) {
            doc.translations.set(langCode, newTranslations[langCode]);
            console.log(`     ✓ Translated to ${langCode.toUpperCase()}`);
            updated = true;
          } else {
            console.log(
              `     ✗ WARNING: No translation returned for ${langCode.toUpperCase()}`
            );
          }
        }

        if (updated) {
          await doc.save();
          console.log(`  ✓ Successfully updated database for ${doc.key}.`);
        } else {
          console.log(`  - No new translations to update for ${doc.key}.`);
        }
        successCount++;
      } catch (error) {
        console.error(`  ✗ ERROR processing ${doc.key}:`, error);
        failedCount++;
      } finally {
        console.log("--------------------");
      }
    }
  } catch (error) {
    console.error("A critical error occurred:", error);
  } finally {
    console.log("\nTranslation process complete.");
    console.log(`Successfully processed: ${successCount}`);
    console.log(`Failed keys: ${failedCount}`);
    await mongoose.connection.close();
    console.log("Database connection closed.");
  }
}

// Execute the script
main().catch(console.error);
