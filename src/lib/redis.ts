// ===== src/lib/redis.ts (Failsafe Method) =====
import 'dotenv/config';
import Redis from "ioredis";
import "server-only";

// Check for the separate variables
if (!process.env.NEXT_PUBLIC_REDIS_HOST || !process.env.NEXT_PUBLIC_REDIS_PORT || !process.env.NEXT_PUBLIC_REDIS_PASSWORD) {
  throw new Error("Redis connection details are not defined in environment variables.");
}

declare global {
  var redis: Redis | undefined;
}

// Build the connection from an object instead of a URL string
const redis = global.redis || new Redis({
  host: process.env.NEXT_PUBLIC_REDIS_HOST,
  port: parseInt(process.env.NEXT_PUBLIC_REDIS_PORT, 10),
  password: process.env.NEXT_PUBLIC_REDIS_PASSWORD,
  // Add this option to prevent long-running connections during build
  // that can sometimes cause issues in serverless environments.
  enableOfflineQueue: false, 
});

if (process.env.NODE_ENV !== "production") {
  global.redis = redis;
}

redis.on('connect', () => {
  console.log('[Redis] A client has successfully connected to the Redis server.');
});

redis.on('error', (err) => {
  console.error('[Redis] Could not connect to the Redis server:', err);
});

export default redis;