// ===== src/lib/dbConnect.ts =====

import mongoose from "mongoose";

const NEXT_PUBLIC_MONGODB_URI = process.env.NEXT_PUBLIC_MONGODB_URI;

if (!NEXT_PUBLIC_MONGODB_URI) {
  throw new Error(
    "Please define the NEXT_PUBLIC_MONGODB_URI environment variable inside .env.local"
  );
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially.
 */
let cached: {
  promise: Promise<any> | null;
} = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { promise: null };
}

async function dbConnect() {
  // If a connection promise already exists, we reuse it.
  // This is the core of the singleton pattern.
  if (cached.promise) {
    console.log("Reusing existing Mongoose connection promise.");
    return await cached.promise;
  }

  // If no connection promise exists, create a new one.
  const opts = {
    bufferCommands: false,
    serverSelectionTimeoutMS: 45000, // A generous timeout for builds
  };

  console.log("Creating new Mongoose connection promise...");
  cached.promise = mongoose
    .connect(NEXT_PUBLIC_MONGODB_URI!, opts)
    .then((mongoose) => {
      console.log("✅ New Mongoose connection established.");
      return mongoose;
    })
    .catch((err) => {
      // If connection fails, nullify the promise so the next call can try again.
      cached.promise = null;
      console.error("❌ Mongoose connection failed:", err);
      throw err; // Rethrow the error to fail the operation (e.g., the build)
    });

  try {
    // Await the newly created promise and return the connection
    return await cached.promise;
  } catch (e) {
    // This catch is for safety but the catch block on the promise itself should handle it.
    cached.promise = null;
    throw e;
  }
}

export default dbConnect;
