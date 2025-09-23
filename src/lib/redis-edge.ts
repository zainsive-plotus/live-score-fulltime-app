// ===== src/lib/redis-edge.ts (NEW FILE) =====

import "server-only";

const REST_URL = process.env.UPSTASH_REDIS_REST_URL;
const REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

if (!REST_URL || !REST_TOKEN) {
  // In a production environment, this should ideally throw an error.
  // For resilience, we'll log a warning and let middleware bypass Redis.
  console.warn(
    "[Redis-Edge] Upstash REST credentials are not configured. Redirects in middleware will be disabled."
  );
}

type RedisCommand = "hgetall";

async function fetchRedis(command: RedisCommand, ...args: (string | number)[]) {
  if (!REST_URL || !REST_TOKEN) return null;

  const commandUrl = `${REST_URL}/${command}/${args.join("/")}`;

  try {
    const response = await fetch(commandUrl, {
      headers: { Authorization: `Bearer ${REST_TOKEN}` },
      cache: "no-store", // Always fetch the latest redirect map
    });

    if (!response.ok) {
      throw new Error(`Redis command failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.result;
  } catch (error) {
    console.error(
      `[Redis-Edge] Failed to execute command '${command}':`,
      error
    );
    return null;
  }
}

const redisEdgeClient = {
  async hgetall(key: string): Promise<Record<string, string> | null> {
    const result = await fetchRedis("hgetall", key);
    if (!result) return null;

    // The Upstash REST API returns an array like [key1, value1, key2, value2].
    // This converts it into a standard JavaScript object.
    const obj: Record<string, string> = {};
    for (let i = 0; i < result.length; i += 2) {
      obj[result[i]] = result[i + 1];
    }
    return obj;
  },
};

export default redisEdgeClient;
