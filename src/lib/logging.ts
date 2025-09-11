// ===== src/lib/logging.ts =====

import "server-only";

// Define the structure of our context object for clear, typed logs
export interface RequestContext {
  source: "client" | "server" | "build-script";
  // The user-facing path, e.g., /en/football/match/man-utd-vs-liverpool-12345
  pagePath?: string;
  // The name of the component or function making the call
  callerName?: string;
}

/**
 * A standardized logger for API requests to the third-party service.
 * It creates a structured log message that is easy to search and filter.
 *
 * @param endpoint The API endpoint being called (e.g., 'fixtures').
 * @param params The parameters sent to the API.
 * @param context Information about where the request originated.
 */
export function logApiRequest(
  endpoint: string,
  params: object,
  context: RequestContext
) {
  const paramsString = JSON.stringify(params);

  // Construct a detailed, key-value log message for better analysis
  const logMessage =
    `[API Request] ` +
    `source=${context.source} ` +
    `caller=${context.callerName || "unknown"} ` +
    `path=${context.pagePath || "unknown"} | ` +
    `==> endpoint=${endpoint} ` +
    `params=${paramsString}`;

  console.log(logMessage);
}
