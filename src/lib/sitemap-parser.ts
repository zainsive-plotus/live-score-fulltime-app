import "server-only";
import axios from "axios";
import { XMLParser } from "fast-xml-parser";

const BASE_URL =
  process.env.NEXT_PUBLIC_PUBLIC_APP_URL || "http://localhost:3000";

/**
 * Fetches and parses all URLs from the site's sitemap index.
 * @returns A promise that resolves to an array of all unique URLs.
 */
export async function getAllUrlsFromSitemaps(): Promise<string[]> {
  console.log("[Sitemap Parser] Starting to fetch sitemaps...");
  const parser = new XMLParser();
  const allUrls = new Set<string>();

  try {
    // 1. Fetch the main sitemap index
    const sitemapIndexUrl = `${BASE_URL}/sitemap.xml`;
    console.log(`[Sitemap Parser] Fetching index: ${sitemapIndexUrl}`);
    const indexResponse = await axios.get(sitemapIndexUrl);
    const sitemapIndex = parser.parse(indexResponse.data);

    if (!sitemapIndex?.sitemapindex?.sitemap) {
      throw new Error(
        "Invalid sitemap index format. Expected <sitemapindex> with <sitemap> tags."
      );
    }

    const subSitemapUrls: string[] = sitemapIndex.sitemapindex.sitemap.map(
      (s: any) => s.loc
    );
    console.log(
      `[Sitemap Parser] Found ${subSitemapUrls.length} sub-sitemaps.`
    );

    // 2. Fetch and parse each sub-sitemap
    for (const subSitemapUrl of subSitemapUrls) {
      try {
        const subResponse = await axios.get(subSitemapUrl);
        const subSitemap = parser.parse(subResponse.data);
        const urlsFromSitemap =
          subSitemap?.urlset?.url?.map((u: any) => u.loc) || [];
        urlsFromSitemap.forEach((url: string) => allUrls.add(url));
        console.log(
          `[Sitemap Parser] Parsed ${urlsFromSitemap.length} URLs from ${subSitemapUrl}`
        );
      } catch (subError) {
        console.error(
          `[Sitemap Parser] Failed to parse sub-sitemap ${subSitemapUrl}`,
          subError
        );
      }
    }

    console.log(
      `[Sitemap Parser] Finished. Found a total of ${allUrls.size} unique URLs.`
    );
    return Array.from(allUrls);
  } catch (error) {
    console.error(
      "[Sitemap Parser] A critical error occurred while fetching sitemaps:",
      error
    );
    return [];
  }
}
