// ===== scripts/update-phrase.ts =====

// This script connects to your MongoDB database and performs a bulk update.
// It finds all occurrences of "fan skor" (case-insensitive) and replaces them with "FanSkor".

import "dotenv/config"; // Use this for top-level await
import mongoose from "mongoose";
import path from "path";

// Load environment variables from .env.local
import { config } from "dotenv";
config({ path: path.resolve(process.cwd(), ".env.local") });

// Use path aliases that tsx will understand from your tsconfig.json
import Post from "@/models/Post";
import SeoContent from "@/models/SeoContent";
import PageContent from "@/models/PageContent";
import Translation from "@/models/Translation";
import TickerMessage from "@/models/TickerMessage";
import Faq from "@/models/Faq";
import TitleTemplate from "@/models/TitleTemplate";

const PHRASE_TO_FIND = /fan skor/gi; // g = global, i = case-insensitive
const PHRASE_TO_REPLACE = "FanSkor";

// A generic function to update a collection
async function updateCollection(
  Model: mongoose.Model<any>,
  fields: string[],
  modelName: string
) {
  console.log(`\n--- Processing collection: ${modelName} ---`);

  const query = {
    $or: fields.map((field) => ({
      [field]: { $regex: "fan skor", $options: "i" },
    })),
  };

  const documentsToUpdate = await Model.find(query);

  if (documentsToUpdate.length === 0) {
    console.log(`No documents containing "fan skor" found in ${modelName}.`);
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
  const documents = await Translation.find({});
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
  if (!process.env.NEXT_PUBLIC_MONGODB_URI) {
    console.error(
      "ERROR: NEXT_PUBLIC_MONGODB_URI not found in .env.local file."
    );
    process.exit(1);
  }

  console.log("Connecting to database...");
  await mongoose.connect(process.env.NEXT_PUBLIC_MONGODB_URI);
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
