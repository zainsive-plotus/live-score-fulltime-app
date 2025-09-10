// ===== src/lib/data/seo.ts =====

import "server-only";
import axios from "axios";
import { ISeoOverride } from "@/models/SeoOverride";

const BASE_URL =
  process.env.NEXT_PUBLIC_PUBLIC_APP_URL || "http://localhost:3000";

/**
 * Fetches SEO override content for a specific entity from the internal API.
 * @param entityType - The type of the entity (e.g., 'league-standings').
 * @param entityId - The ID of the entity.
 * @param language - The language code for the content.
 * @returns {Promise<ISeoOverride | null>} The SEO override data or null if not found or on error.
 */
export async function getSeoOverride(
  entityType: string,
  entityId: string,
  language: string
): Promise<ISeoOverride | null> {
  try {
    const { data } = await axios.get(
      `${BASE_URL}/api/seo-content/overrides?entityType=${entityType}&entityId=${entityId}&language=${language}`
    );
    return data;
  } catch (error) {
    // It's common for overrides not to exist, so we don't log an error here.
    // The calling function will handle the null case.
    return null;
  }
}
