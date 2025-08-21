// src/lib/redis.ts

import "dotenv/config";
import Redis from "ioredis";
import "server-only";
import mockRedisClient from "./redis.mock";

declare global {
  var redis: Redis | undefined;
}

let redisClient: Redis | typeof mockRedisClient;

// The key change is here: We check for a CI environment variable.
// Vercel and other build systems set CI=true during the build process.
// This forces the build to use the mock, bypassing the connection issue.
// Your live, running application will have CI=false and connect to the real Redis.
if (
  process.env.NEXT_PUBLIC_NODE_ENV === "production" &&
  !process.env.NEXT_PUBLIC_CI
) {
  if (
    !process.env.NEXT_PUBLIC_REDIS_HOST ||
    !process.env.NEXT_PUBLIC_REDIS_PORT ||
    !process.env.NEXT_PUBLIC_REDIS_PASSWORD
  ) {
    throw new Error(
      "Production Redis connection details (REDIS_HOST, REDIS_PORT, REDIS_PASSWORD) are not defined for the running application."
    );
  }

  if (!global.redis) {
    global.redis = new Redis({
      host: process.env.NEXT_PUBLIC_REDIS_HOST,
      port: parseInt(process.env.NEXT_PUBLIC_REDIS_PORT, 10),
      password: process.env.NEXT_PUBLIC_REDIS_PASSWORD,
      enableOfflineQueue: false, // This is correct, keep it false.
    });

    global.redis.on("connect", () => {
      console.log("[Redis] Production runtime connection established.");
    });

    global.redis.on("error", (err) => {
      console.error(
        "[Redis] Production runtime connection Error:",
        err.message
      );
    });
  }
  redisClient = global.redis;
} else {
  // Use mock for local development AND for the build process (when CI=true)
  if (process.env.CI) {
    console.log(
      "[Redis] Using MOCK Redis client for build process (CI environment)."
    );
  }
  redisClient = mockRedisClient;
}

export default redisClient;
