// ===== scripts/change-author.ts =====

/**
 * A command-line script to update the author name for all posts in the database.
 *
 * This script is designed to be run with `tsx` to handle TypeScript and path aliases correctly.
 *
 * Usage:
 * npx tsx scripts/change-author.ts "Old Author Name" "New Author Name"
 *
 * Example:
 * npx tsx scripts/change-author.ts "Admin" "Fan Skor Staff"
 */

import "dotenv/config";
import mongoose from "mongoose";
import path from "path";
import { config } from "dotenv";

// Ensure .env.local is loaded from the project root
config({ path: path.resolve(process.cwd(), ".env.local") });

// Import the Mongoose Post model using path aliases
import Post from "@/models/Post";

// --- MAIN EXECUTION LOGIC ---

async function runUpdate() {
  // 1. Get and validate command-line arguments
  const oldAuthor = process.argv[2];
  const newAuthor = process.argv[3];

  if (!oldAuthor || !newAuthor) {
    console.error("\n❌ Error: Missing required arguments.");
    console.log(
      '   Usage: npx tsx scripts/change-author.ts "<Old Author Name>" "<New Author Name>"'
    );
    console.log(
      '   Example: npx tsx scripts/change-author.ts "Admin" "Fan Skor Staff"\n'
    );
    process.exit(1); // Exit with an error code
  }

  if (!process.env.NEXT_PUBLIC_MONGODB_URI) {
    console.error(
      "ERROR: NEXT_PUBLIC_MONGODB_URI not found in .env.local file."
    );
    process.exit(1);
  }

  console.log("Connecting to database...");
  await mongoose.connect(process.env.NEXT_PUBLIC_MONGODB_URI);
  console.log("✅ Database connected successfully.");

  try {
    console.log(`\n🔍 Searching for posts with author: "${oldAuthor}"`);

    // 2. Use `updateMany` for a single, efficient database operation.
    // This is vastly faster than fetching, looping, and saving.
    const result = await Post.updateMany(
      { author: oldAuthor }, // The filter: find all posts by the old author
      { $set: { author: newAuthor } } // The update: set the author field to the new name
    );

    console.log("\n--- UPDATE COMPLETE ---");
    console.log(`Matched Documents: ${result.matchedCount}`);
    console.log(`Updated Documents: ${result.modifiedCount}`);

    if (result.matchedCount === 0) {
      console.warn(
        `\n⚠️ No posts were found with the author name "${oldAuthor}". No changes were made.`
      );
    } else {
      console.log(
        `\n✅ Successfully updated author name from "${oldAuthor}" to "${newAuthor}".`
      );
    }
  } catch (error) {
    console.error("\n--- A CRITICAL ERROR OCCURRED ---");
    console.error(error);
  } finally {
    await mongoose.connection.close();
    console.log("\n🔌 Database connection closed.");
  }
}

runUpdate();
