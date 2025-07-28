// ===== src/lib/redis.mock.ts =====

const mockRedisClient = {
  get: async (key: string): Promise<string | null> => {
    console.log(`[Redis Mock] Getting key: ${key}`);
    return null;
  },
  set: async (
    key: string,
    value: string,
    ...args: any[]
  ): Promise<"OK" | null> => {
    console.log(`[Redis Mock] Setting key: ${key} with value and args:`, args);
    return "OK";
  },
  // --- Start: The Fix ---
  del: async (key: string): Promise<number> => {
    console.log(`[Redis Mock] Deleting key: ${key}`);
    // Mimics the real ioredis client, which returns the number of keys deleted.
    return 1;
  },
  // --- End: The Fix ---
  hgetall: async (key: string): Promise<Record<string, string>> => {
    console.log(`[Redis Mock] Getting all hashes for key: ${key}`);
    return {};
  },
  pipeline: () => ({
    hset: () => {
      console.log("[Redis Mock] Pipeline: hset called");
    },
    expire: () => {
      console.log("[Redis Mock] Pipeline: expire called");
    },
    exec: async () => {
      console.log("[Redis Mock] Pipeline: exec called");
      return [];
    },
  }),
};

export default mockRedisClient;