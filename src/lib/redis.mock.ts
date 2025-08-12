// ===== src/lib/redis.mock.ts =====

// This is a simplified in-memory mock of the ioredis client for development
const mockStore: { [key: string]: string } = {};

const mockRedisClient = {
  get: async (key: string): Promise<string | null> => {
    console.log(`[Redis Mock] GET ${key}`);
    return mockStore[key] || null;
  },
  set: async (
    key: string,
    value: string,
    ...args: any[]
  ): Promise<"OK" | null> => {
    console.log(`[Redis Mock] SET ${key}`);
    mockStore[key] = value;
    return "OK";
  },

  // --- THIS IS THE FIX ---
  // Implemented the missing 'del' and 'keys' methods.
  del: async (...keys: string[]): Promise<number> => {
    console.log(`[Redis Mock] DEL ${keys.join(" ")}`);
    let count = 0;
    keys.forEach((key) => {
      if (mockStore[key] !== undefined) {
        delete mockStore[key];
        count++;
      }
    });
    return count;
  },

  keys: async (pattern: string): Promise<string[]> => {
    console.log(`[Redis Mock] KEYS ${pattern}`);
    const regex = new RegExp(pattern.replace(/\*/g, ".*"));
    return Object.keys(mockStore).filter((key) => regex.test(key));
  },
  // --- END OF FIX ---

  hgetall: async (key: string): Promise<Record<string, string>> => {
    console.log(`[Redis Mock] HGETALL ${key}`);
    return JSON.parse(mockStore[key] || "{}");
  },
  pipeline: () => ({
    hset: () => {},
    expire: () => {},
    exec: async () => {
      return [];
    },
  }),
  expire: async (key: string, seconds: number): Promise<number> => {
    console.log(`[Redis Mock] EXPIRE ${key} ${seconds}`);
    return 1;
  },
};

export default mockRedisClient;
