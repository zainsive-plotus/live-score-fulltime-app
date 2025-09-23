// ===== src/lib/redirect-cache.ts (UPDATED) =====

import "server-only";
import dbConnect from "./dbConnect";
import Redirect from "@/models/Redirect";
import redis from "./redis";

export const REDIRECT_CACHE_TTL = 60 * 60 * 24 * 7; // 7 days

export async function updateRedirectCache(): Promise<void> {
  try {
    await dbConnect();
    const activeRedirects = await Redirect.find({ isActive: true }).lean();

    await redis.del("redirects:map:v1");

    if (activeRedirects.length > 0) {
      const redirectMap: Record<string, string> = {};
      for (const redirect of activeRedirects) {
        for (const sourcePath of redirect.sourcePaths) {
          const normalizedPath = `/${sourcePath
            .trim()
            .replace(/^\/|\/$/g, "")}`;
          redirectMap[normalizedPath] = JSON.stringify({
            destination: redirect.destinationUrl,
            status: redirect.statusCode,
          });
        }
      }

      if (Object.keys(redirectMap).length > 0) {
        await redis.hmset("redirects:map:v1", redirectMap);
        await redis.expire("redirects:map:v1", REDIRECT_CACHE_TTL);
      }
    }
    console.log(
      `[Redirect Cache] Cache updated with ${activeRedirects.length} redirect rules.`
    );
  } catch (error) {
    console.error("[Redirect Cache] Failed to update redirect cache:", error);
  }
}
