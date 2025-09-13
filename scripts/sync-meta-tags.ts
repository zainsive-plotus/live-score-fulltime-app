// ===== scripts/sync-meta-tags.ts =====

/**
 * A script to synchronize meta titles and descriptions across post translations.
 *
 * This script ensures that all non-Turkish translations (fr, es, zu, it, etc.)
 * use the meta title and description from the English ('en') version of the post.
 * The Turkish ('tr') version is never modified.
 *
 * Usage:
 * npx tsx scripts/sync-meta-tags.ts
 */

import "dotenv/config";
import mongoose from "mongoose";
import path from "path";
import { config } from "dotenv";

config({ path: path.resolve(process.cwd(), ".env.local") });

import Post from "@/models/Post";

async function runUpdate() {
  if (!process.env.MONGODB_URI) {
    console.error("❌ ERROR: MONGODB_URI not found in .env.local file.");
    process.exit(1);
  }

  console.log("Connecting to database...");
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("✅ Database connected successfully.");

  try {
    console.log("\nFetching all post translation groups...");

    // 1. Use an aggregation pipeline to efficiently fetch all posts grouped by translationGroupId
    const postGroups = await Post.aggregate([
      {
        $group: {
          _id: "$translationGroupId",
          posts: { $push: "$$ROOT" },
        },
      },
    ]);

    console.log(`Found ${postGroups.length} translation groups to process.`);
    let groupsProcessed = 0;
    let postsUpdated = 0;

    // 2. Iterate over each group of posts
    for (const group of postGroups) {
      const sourceEnglishPost = group.posts.find(
        (p: any) => p.language === "en"
      );
      const turkishPost = group.posts.find((p: any) => p.language === "tr");

      // 3. Check for the required source English post
      if (!sourceEnglishPost) {
        console.warn(
          `⚠️ Skipping group ${group._id}: No English source post found.`
        );
        continue;
      }

      // Extract the source meta content. Fallback to the title if metaTitle is missing.
      const sourceMetaTitle =
        sourceEnglishPost.metaTitle || sourceEnglishPost.title;
      const sourceMetaDescription = sourceEnglishPost.metaDescription || "";

      const bulkOps = [];

      // 4. Iterate through posts in the group to find targets for update
      for (const post of group.posts) {
        // Condition: DO NOT update the Turkish post, and DO NOT update the English post itself.
        if (post.language !== "tr" && post.language !== "en") {
          // Check if an update is actually needed to avoid unnecessary database writes
          if (
            post.metaTitle !== sourceMetaTitle ||
            post.metaDescription !== sourceMetaDescription
          ) {
            bulkOps.push({
              updateOne: {
                filter: { _id: post._id },
                update: {
                  $set: {
                    metaTitle: sourceMetaTitle,
                    metaDescription: sourceMetaDescription,
                  },
                },
              },
            });
          }
        }
      }

      // 5. If there are updates to be made for this group, execute them in a single bulk operation
      if (bulkOps.length > 0) {
        await Post.bulkWrite(bulkOps);
        console.log(
          `  - Group ${group._id}: Updated ${bulkOps.length} translations.`
        );
        postsUpdated += bulkOps.length;
      }
      groupsProcessed++;
    }

    console.log(`\n--- UPDATE COMPLETE ---`);
    console.log(`Total groups processed: ${groupsProcessed}`);
    console.log(`Total individual posts updated: ${postsUpdated}`);
  } catch (error) {
    console.error("\n--- A CRITICAL ERROR OCCURRED ---");
    console.error(error);
  } finally {
    await mongoose.connection.close();
    console.log("\n🔌 Database connection closed.");
  }
}

runUpdate();
