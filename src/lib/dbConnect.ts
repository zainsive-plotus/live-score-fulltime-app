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
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  // If we have a connection, reuse it
  if (cached.conn) {
    return cached.conn;
  }

  // If a promise is already in progress, wait for it to resolve
  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      // Increase timeouts to make the connection more resilient during builds
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      // Mongoose 6 default is 5, let's allow more for parallel builds
      maxPoolSize: 10,
    };

    console.log("Creating new Mongoose connection...");
    cached.promise = mongoose
      .connect(NEXT_PUBLIC_MONGODB_URI!, opts)
      .then((mongoose) => {
        console.log("New Mongoose connection established.");
        return mongoose;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    // If the connection fails, reset the promise so the next call can try again
    cached.promise = null;
    console.error("Mongoose connection failed:", e);
    throw e;
  }

  return cached.conn;
}

export default dbConnect;
