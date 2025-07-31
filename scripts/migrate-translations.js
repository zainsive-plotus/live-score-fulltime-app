// ===== scripts/migrate-translations.js =====

const mongoose = require("mongoose");
const fs = require("fs").promises; // Use Node.js File System module for local files
const path = require("path"); // Use Node.js Path module to handle file paths correctly

// --- DATABASE CONNECTION LOGIC (Using .env file for security) ---
const NEXT_PUBLIC_MONGODB_URI =
  "mongodb+srv://malikseo856:Djr9jOgdoMQ862xG@cluster0.pu5jzdv.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

if (!NEXT_PUBLIC_MONGODB_URI) {
  throw new Error(
    "Please define the NEXT_PUBLIC_MONGODB_URI environment variable inside .env file"
  );
}

let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  if (cached.conn) {
    return cached.conn;
  }
  if (!cached.promise) {
    const opts = { bufferCommands: false };
    cached.promise = mongoose
      .connect(NEXT_PUBLIC_MONGODB_URI, opts)
      .then((mongoose) => mongoose);
  }
  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }
  return cached.conn;
}

// --- TRANSLATION MODEL ---
const TranslationSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
      match: /^[a-z0-9_]+$/,
    },
    group: {
      type: String,
      required: true,
      trim: true,
      index: true,
      default: "general",
    },
    description: {
      type: String,
      trim: true,
    },
    translations: {
      type: Map,
      of: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Translation =
  mongoose.models.Translation ||
  mongoose.model("Translation", TranslationSchema);

// --- LOCAL FILE PATHS (assuming they are in src/locales) ---
const translationFilePaths = {
  en: "src/locales/en.json",
  es: "src/locales/es.json",
  fr: "src/locales/fr.json",
  it: "src/locales/it.json",
  tr: "src/locales/tr.json",
  zu: "src/locales/zu.json",
};
// --- END OF CONFIGURATION ---

// --- NEW FUNCTION to read local files ---
async function fetchTranslationsFromLocalFiles(paths) {
  console.log("Reading translation files from local directory...");
  const allTranslations = {};
  for (const [langCode, relativePath] of Object.entries(paths)) {
    try {
      // Construct the full path from the project root
      const absolutePath = path.join(process.cwd(), relativePath);
      console.log(` -> Reading ${langCode.toUpperCase()} from ${absolutePath}`);
      const fileContent = await fs.readFile(absolutePath, "utf-8");
      allTranslations[langCode] = JSON.parse(fileContent);
      console.log(
        `    ✓ Successfully read and parsed ${langCode.toUpperCase()}.`
      );
    } catch (error) {
      if (error.code === "ENOENT") {
        console.error(
          `    ❌ FAILED to read ${langCode.toUpperCase()}. File not found at ${relativePath}. Skipping this language.`
        );
      } else {
        console.error(
          `    ❌ FAILED to read or parse ${langCode.toUpperCase()} from ${relativePath}. Error: ${
            error.message
          }. Skipping this language.`
        );
      }
    }
  }
  return allTranslations;
}

function determineGroup(key) {
  if (key.startsWith("admin_")) return "admin";
  if (key.startsWith("faq_")) return "faq";
  if (key.startsWith("contact_")) return "contact";
  if (key.startsWith("footer_")) return "footer";
  if (key.startsWith("match_")) return "match_details";
  if (key.startsWith("league_")) return "league_details";
  if (key.startsWith("team_")) return "team_details";
  if (key.startsWith("teams_")) return "teams_page";
  if (key.startsWith("leagues_")) return "leagues_page";
  if (key.startsWith("news_")) return "news";
  if (key.startsWith("stat_card_")) return "stat_cards";
  if (key.startsWith("table_header_")) return "table_headers";
  if (key.includes("_page_")) return "page_meta";
  return "general";
}

async function migrate() {
  // Use the new function to read local files
  const allTranslations = await fetchTranslationsFromLocalFiles(
    translationFilePaths
  );

  if (Object.keys(allTranslations).length === 0) {
    console.error(
      "\n❌ ERROR: No translation data could be read. Please check your file paths in the script.\n"
    );
    return;
  }

  console.log("Connecting to database...");
  await dbConnect();
  console.log("Database connection successful.");

  const aggregated = new Map();

  console.log("Aggregating translations...");
  for (const [langCode, translations] of Object.entries(allTranslations)) {
    for (const [key, value] of Object.entries(translations)) {
      if (!aggregated.has(key)) {
        aggregated.set(key, {
          key: key,
          group: determineGroup(key),
          translations: new Map(),
        });
      }
      aggregated.get(key).translations.set(langCode, value);
    }
  }
  console.log(
    `Found and aggregated ${aggregated.size} unique translation keys.`
  );

  const operations = [];
  for (const [key, data] of aggregated.entries()) {
    const translationDoc = {
      key: data.key,
      group: data.group,
      translations: Object.fromEntries(data.translations),
    };
    operations.push(
      Translation.updateOne(
        { key: key },
        { $set: translationDoc },
        { upsert: true }
      )
    );
  }

  console.log(`Preparing to upsert ${operations.length} documents...`);

  try {
    const result = await Promise.all(operations);
    const upsertedCount = result.filter((r) => r.upsertedCount > 0).length;
    const modifiedCount = result.filter((r) => r.modifiedCount > 0).length;

    console.log("----------------------------------------");
    console.log("✅ Migration complete!");
    console.log(`   - ${upsertedCount} new keys inserted.`);
    console.log(`   - ${modifiedCount} existing keys updated.`);
    console.log("----------------------------------------");
  } catch (error) {
    console.error("❌ An error occurred during database operations:", error);
  } finally {
    await mongoose.connection.close();
    console.log("Database connection closed.");
  }
}

migrate().catch((err) => {
  console.error("❌ Migration script failed:", err);
  mongoose.connection.close();
});
