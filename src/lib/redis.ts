// ===== src/lib/redis.ts =====

import Redis from "ioredis";
import "server-only";

// Ensure the REDIS_URL is defined in your environment variables
if (!process.env.REDIS_URL) {
  throw new Error("REDIS_URL is not defined in environment variables.");
}

// This is a singleton pattern. It prevents creating a new Redis connection on every server-side render or API call.
// In a serverless environment, this helps reuse connections across invocations.
declare global {
  // allow global `var` declarations
  // eslint-disable-next-line no-var
  var redis: Redis | undefined;
}

const redis = global.redis || new Redis(process.env.REDIS_URL);

if (process.env.NODE_ENV !== "production") {
  global.redis = redis;
}

// Add a connection listener for debugging
redis.on('connect', () => {
  console.log('[Redis] Successfully connected to the Redis server.');
});

redis.on('error', (err) => {
  console.error('[Redis] Could not connect to the Redis server:', err);
});

export default redis;