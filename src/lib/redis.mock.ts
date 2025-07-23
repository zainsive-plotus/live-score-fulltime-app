// ===== src/lib/redis.mock.ts =====

// This is a mock client that mimics the ioredis interface.
// It does nothing, effectively disabling the cache for local development.

console.log("[Redis Mock] Using mock Redis client for development. Caching is disabled.");

const mockRedisClient = {
  get: async (key: string): Promise<string | null> => {
    return null; // Always return null to simulate a cache miss
  },
  set: async (key: string, value: string, ...args: any[]): Promise<"OK" | null> => {
    return "OK"; // Do nothing, just return OK
  },
  hgetall: async (key: string): Promise<Record<string, string>> => {
    return {}; // Always return empty object to simulate a cache miss
  },
  pipeline: () => ({ // Mock the pipeline for the image proxy
    hset: () => {},
    expire: () => {},
    exec: async () => [],
  }),
  // Add any other Redis commands you use here if necessary
};

export default mockRedisClient;