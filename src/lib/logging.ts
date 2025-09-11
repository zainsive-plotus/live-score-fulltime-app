// ===== src/lib/logging.ts =====

import "server-only";
import { NextRequest } from "next/server";

// --- CORE CHANGE: Added ip, userAgent, and geo to the context ---
export interface RequestContext {
  source: "client" | "server" | "build-script";
  pagePath?: string;
  callerName?: string;
  ip?: string;
  userAgent?: string;
  geo?: {
    city?: string;
    country?: string;
    region?: string;
  };
}

/**
 * Creates a RequestContext object from a NextRequest.
 * This is a helper to standardize context creation in your pages.
 * @param req The NextRequest object.
 * @param callerName The name of the function creating the context.
 * @returns A populated RequestContext object.
 */
export function createContextFromRequest(
  req: NextRequest,
  callerName: string
): RequestContext {
  return {
    source: "server",
    pagePath: req.nextUrl.pathname,
    callerName,
    ip: req.ip,
    userAgent: req.headers.get("user-agent") || "unknown",
    geo: {
      city: req.geo?.city,
      country: req.geo?.country,
      region: req.geo?.region,
    },
  };
}

/**
 * A standardized logger for API requests to the third-party service.
 * It creates a structured log message that is easy to search and filter.
 */
export function logApiRequest(
  endpoint: string,
  params: object,
  context: RequestContext
) {
  const paramsString = JSON.stringify(params);

  // --- CORE CHANGE: Added new fields to the log output ---
  const logMessage =
    `[API Request] ` +
    `source=${context.source} ` +
    `caller=${context.callerName || "unknown"} ` +
    `path=${context.pagePath || "unknown"} ` +
    `ip=${context.ip || "unknown"} ` +
    `geo=${context.geo?.city || "?"},${context.geo?.country || "?"} ` +
    `userAgent="${context.userAgent || "unknown"}" | ` +
    `==> endpoint=${endpoint} ` +
    `params=${paramsString}`;

  console.log(logMessage);
}
