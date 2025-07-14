// To run this script, use: node scripts/seedLanguages.js

const mongoose = require("mongoose");

// We need to define the schema directly here since we can't import the TS model easily
const LanguageSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    isActive: { type: Boolean, default: true },
    isDefault: { type: Boolean, default: false },
    flagUrl: { type: String, trim: true },
  },
  { timestamps: true }
);

const Language =
  mongoose.models.Language || mongoose.model("Language", LanguageSchema);

const languagesToSeed = [
  {
    name: "Turkish",
    code: "tr",
    isActive: true,
    isDefault: true,
    flagUrl: "/flags/tr.png",
  },
  {
    name: "English",
    code: "en",
    isActive: true,
    isDefault: false,
    flagUrl: "/flags/gb.png",
  },
  {
    name: "German",
    code: "de",
    isActive: true,
    isDefault: false,
    flagUrl: "/flags/de.png",
  },
  {
    name: "French",
    code: "fr",
    isActive: true,
    isDefault: false,
    flagUrl: "/flags/fr.png",
  },
  {
    name: "Spanish",
    code: "es",
    isActive: true,
    isDefault: false,
    flagUrl: "/flags/es.png",
  },
  {
    name: "Arabic",
    code: "ar",
    isActive: true,
    isDefault: false,
    flagUrl: "/flags/sa.png",
  },
];

const seedDatabase = async () => {
  const MONGODB_URI =
    "mongodb+srv://malikseo856:Djr9jOgdoMQ862xG@cluster0.pu5jzdv.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"; // Replace with your actual MongoDB URI

  if (!MONGODB_URI) {
    console.error("Please provide MONGODB_URI in the script.");
    process.exit(1);
  }

  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("Connected to the database. Seeding languages...");

    // Clear existing languages to ensure a clean seed
    await Language.deleteMany({});
    console.log("Cleared existing languages.");

    // Insert the new languages
    await Language.insertMany(languagesToSeed);
    console.log(`Successfully seeded ${languagesToSeed.length} languages.`);
  } catch (error) {
    console.error("Error seeding the database:", error);
  } finally {
    // Disconnect from the database
    await mongoose.connection.close();
    console.log("Database connection closed.");
  }
};

seedDatabase();
