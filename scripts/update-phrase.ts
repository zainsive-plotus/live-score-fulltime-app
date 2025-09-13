// ===== scripts/update-phrase.ts =====

/**
 * A one-time script to update the brand name capitalization in the database.
 * It finds all occurrences of "FanSkor" (case-sensitive) and replaces them with "Fanskor".
 *
 * This script is designed to be run with `tsx` to handle TypeScript and path aliases.
 *
 * Usage:
 * npx tsx scripts/update-phrase.ts
 */

import mongoose from "mongoose";

// Import all relevant Mongoose Models using path aliases
import Post from "@/models/Post";
import SeoContent from "@/models/SeoContent";
import PageContent from "@/models/PageContent";
import Translation from "@/models/Translation";
import TickerMessage from "@/models/TickerMessage";
import Faq from "@/models/Faq";
import TitleTemplate from "@/models/TitleTemplate";
import SeoOverride from "@/models/SeoOverride"; // ADDED: Include the new SEO Override model

// MODIFIED: Updated the phrases for this specific task
const PHRASE_TO_FIND = /FanSkor/g; // g = global, case-SENSITIVE
const PHRASE_TO_REPLACE = "Fanskor";
const SEARCH_REGEX = "FanSkor"; // Case-sensitive search string for the query

// A generic function to update a collection
async function updateCollection(
  Model: mongoose.Model<any>,
  fields: string[],
  modelName: string
) {
  console.log(`\n--- Processing collection: ${modelName} ---`);

  const query = {
    $or: fields.map((field) => ({ [field]: { $regex: SEARCH_REGEX } })),
  };

  const documentsToUpdate = await Model.find(query);

  if (documentsToUpdate.length === 0) {
    console.log(
      `No documents containing "${SEARCH_REGEX}" found in ${modelName}.`
    );
    return 0;
  }

  console.log(
    `Found ${documentsToUpdate.length} documents to update in ${modelName}.`
  );
  let updatedCount = 0;

  for (const doc of documentsToUpdate) {
    let modified = false;
    fields.forEach((field) => {
      if (doc[field] && typeof doc[field] === "string") {
        const originalValue = doc[field];
        doc[field] = originalValue.replace(PHRASE_TO_FIND, PHRASE_TO_REPLACE);
        if (originalValue !== doc[field]) {
          modified = true;
        }
      }
    });

    if (modified) {
      await doc.save();
      console.log(`  - Updated document ID: ${doc._id}`);
      updatedCount++;
    }
  }

  console.log(
    `Finished processing ${modelName}. Updated ${updatedCount} documents.`
  );
  return updatedCount;
}

// Special handler for the `Translation` model due to its Map structure
async function updateTranslationsCollection() {
  console.log(`\n--- Processing collection: Translation ---`);
  const documents = await Translation.find({ translations: { $exists: true } });
  let updatedCount = 0;

  for (const doc of documents) {
    let modified = false;
    const newTranslations = new Map();
    for (const [lang, text] of doc.translations.entries()) {
      if (typeof text === "string" && PHRASE_TO_FIND.test(text)) {
        newTranslations.set(
          lang,
          text.replace(PHRASE_TO_FIND, PHRASE_TO_REPLACE)
        );
        modified = true;
      } else {
        newTranslations.set(lang, text);
      }
    }

    if (modified) {
      doc.translations = newTranslations;
      await doc.save();
      console.log(`  - Updated Translation document ID: ${doc._id}`);
      updatedCount++;
    }
  }
  console.log(
    `Finished processing Translation. Updated ${updatedCount} documents.`
  );
  return updatedCount;
}

async function runUpdate() {
  if (!process.env.MONGODB_URI) {
    console.error("ERROR: MONGODB_URI not found in .env.local file.");
    process.exit(1);
  }

  console.log("Connecting to database...");
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Database connected successfully.");

  let totalUpdated = 0;

  try {
    totalUpdated += await updateCollection(
      Post,
      ["title", "content", "metaTitle", "metaDescription"],
      "Post"
    );
    totalUpdated += await updateCollection(
      SeoContent,
      ["seoText"],
      "SeoContent"
    );
    totalUpdated += await updateCollection(
      PageContent,
      ["title", "content"],
      "PageContent"
    );
    totalUpdated += await updateCollection(
      TickerMessage,
      ["message"],
      "TickerMessage"
    );
    totalUpdated += await updateCollection(Faq, ["question", "answer"], "Faq");
    totalUpdated += await updateCollection(
      TitleTemplate,
      ["template", "name", "description"],
      "TitleTemplate"
    );
    // ADDED: Process the new SeoOverride collection
    totalUpdated += await updateCollection(
      SeoOverride,
      ["metaTitle", "metaDescription", "seoText"],
      "SeoOverride"
    );

    totalUpdated += await updateTranslationsCollection();

    console.log(`\n--- UPDATE COMPLETE ---`);
    console.log(
      `Total documents updated across all collections: ${totalUpdated}`
    );
  } catch (error) {
    console.error("\n--- A CRITICAL ERROR OCCURRED ---");
    console.error(error);
  } finally {
    await mongoose.connection.close();
    console.log("\nDatabase connection closed.");
  }
}

runUpdate();
