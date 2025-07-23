// ===== src/lib/redis.ts (Corrected) =====

import Redis from "ioredis";
import "server-only";
import mockRedisClient from "./redis.mock";

// This declaration must be at the top level of the module.
declare global {
  // We declare the global variable to hold the Redis client instance.
  // This is part of the singleton pattern to ensure a single connection.
  var redis: Redis | undefined;
}

let redisClient: Redis | typeof mockRedisClient;

// Check if we are in a production environment AND a REDIS_URL is provided
if (process.env.NEXT_PUBLIC_NODE_ENV === 'production' && process.env.NEXT_PUBLIC_REDIS_URL) {
  
  // In production, we initialize the real Redis client.
  // We check if the instance already exists on the global object.
  // If not, we create it.
  if (!global.redis) {
    global.redis = new Redis(process.env.NEXT_PUBLIC_REDIS_URL, {
      enableOfflineQueue: false,
    });

    global.redis.on('connect', () => {
      console.log('[Redis] Successfully connected to the production Redis server.');
    });
    
    global.redis.on('error', (err) => {
      console.error('[Redis] Production Redis client error:', err);
    });
  }
  
  redisClient = global.redis;

} else {
  // In development, or if REDIS_URL is not set, we use the mock client.
  // This disables caching and removes the need for a local Redis instance.
  redisClient = mockRedisClient;
}

export default redisClient;