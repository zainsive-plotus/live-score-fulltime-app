// ===== src/lib/indexnow.ts =====

import "server-only";
import axios from "axios";

const INDEXNOW_KEY = process.env.NEXT_PUBLIC_INDEXNOW_KEY;

// MODIFIED: The regular expression is now correctly escaped.
const HOST = process.env.NEXT_PUBLIC_PUBLIC_APP_URL?.replace(
  /^https?:\/\//,
  ""
);

const SEARCH_ENGINES = [
  "https://api.indexnow.org/indexnow", // This is the main endpoint that pings multiple engines
  "https://www.bing.com/indexnow",
];

interface SubmissionPayload {
  host: string;
  key: string;
  keyLocation: string;
  urlList: string[];
}

/**
 * Submits a list of URLs to the IndexNow API for participating search engines.
 * @param urls - An array of full, absolute URLs that have been created or updated.
 * @returns A boolean indicating if the submission was successfully initiated.
 */
export async function submitUrlsToIndexNow(urls: string[]): Promise<boolean> {
  if (!INDEXNOW_KEY || !HOST) {
    console.warn(
      "[IndexNow] INDEXNOW_KEY or site HOST is not configured. Skipping submission."
    );
    return false;
  }

  if (!Array.isArray(urls) || urls.length === 0) {
    console.warn("[IndexNow] No URLs provided for submission.");
    return false;
  }

  // The key location is the URL to the .txt file in your public directory.
  const keyLocation = `${process.env.NEXT_PUBLIC_PUBLIC_APP_URL}/${INDEXNOW_KEY}.txt`;

  const payload: SubmissionPayload = {
    host: HOST,
    key: INDEXNOW_KEY,
    keyLocation: keyLocation,
    urlList: urls,
  };

  const submissionPromises = SEARCH_ENGINES.map((endpoint) =>
    axios.post(endpoint, payload, {
      headers: { "Content-Type": "application/json; charset=utf-8" },
      timeout: 5000, // 5 second timeout
    })
  );

  try {
    console.log(
      `[IndexNow] Submitting ${payload.urlList.length} URL(s):`,
      payload.urlList
    );
    const results = await Promise.allSettled(submissionPromises);

    results.forEach((result, index) => {
      if (result.status === "fulfilled") {
        console.log(
          `[IndexNow] Successfully submitted to ${SEARCH_ENGINES[index]} (Status: ${result.value.status})`
        );
      } else {
        console.error(
          `[IndexNow] Failed to submit to ${SEARCH_ENGINES[index]}:`,
          result.reason.message
        );
      }
    });

    // Return true if at least one submission was successful.
    return results.some((r) => r.status === "fulfilled");
  } catch (error) {
    console.error(
      "[IndexNow] A critical error occurred during submission:",
      error
    );
    return false;
  }
}
