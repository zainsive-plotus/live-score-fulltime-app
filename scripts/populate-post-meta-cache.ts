import "dotenv/config"; // Make sure to load environment variables
import mongoose from "mongoose";
import Redis from "ioredis";
import Post from "../src/models/Post"; // Adjust the path to your Post model

// --- Configuration ---
const MONGO_URI =
  "mongodb+srv://malikseo856:Djr9jOgdoMQ862xG@cluster0.pu5jzdv.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

const CACHE_TTL_SECONDS = 60 * 60 * 24 * 30; // Cache for 30 days

// --- Main Script Logic ---
async function main() {
  console.log("🚀 Starting post metadata cache population...");

  // Connect to services
  await mongoose.connect(MONGO_URI);
  console.log("✓ MongoDB connection established.");
  const redis = new Redis({
    host: "redis-14265.c250.eu-central-1-1.ec2.redns.redis-cloud.com",
    port: "14265",
    password: "pc8yx7Xg09TRnmlocgUjGTHn4YlXz9rt",
  });
  console.log("✓ Redis connection established.");

  // Fetch all published posts
  const allPosts = await Post.find({ status: "published" }).lean();
  console.log(`Found ${allPosts.length} published posts to cache.`);

  if (allPosts.length === 0) {
    console.log("No posts to process. Exiting.");
    return;
  }

  // Use a pipeline for efficient batching
  const pipeline = redis.pipeline();
  let count = 0;

  for (const post of allPosts) {
    const cacheKey = `post:meta:${post.language}:${post.slug}`;
    const cacheValue = JSON.stringify({
      _id: post._id.toString(),
      // title: post.title,
      metaTitle: post.metaTitle,
      metaDescription: post.metaDescription,
      //   content: post.content, // Needed for fallback description
      // featuredImage: post.featuredImage,
      // author: post.author,
      // createdAt: post.createdAt.toISOString(),
      // updatedAt: post.updatedAt.toISOString(),
      // translationGroupId: post.translationGroupId.toString(),
    });

    pipeline.set(cacheKey, cacheValue, "EX", CACHE_TTL_SECONDS);
    count++;
  }

  await pipeline.exec();
  console.log(
    `✓ Successfully queued ${count} post metadata records for Redis.`
  );

  // Clean up connections
  await mongoose.disconnect();
  await redis.quit();
  console.log("🎉 Cache population complete!");
}

main().catch((error) => {
  console.error("\n❌ Script failed with a critical error:", error);
  process.exit(1);
});
