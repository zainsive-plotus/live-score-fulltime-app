// ===== src/app/sitemap-standings.xml/route.ts =====

import axios from "axios";
import { SUPPORTED_LOCALES, DEFAULT_LOCALE } from "@/lib/i18n/config";

const BASE_URL =
  process.env.NEXT_PUBLIC_PUBLIC_APP_URL || "http://localhost:3000";

type SitemapEntry = {
  url: string;
  lastModified?: string | Date;
  changeFrequency?: "daily" | "weekly" | "monthly";
  priority?: number;
};

const getUrl = (path: string, locale: string) => {
  if (locale === DEFAULT_LOCALE) {
    return `${BASE_URL}${path}`;
  }
  return `${BASE_URL}/${locale}${path}`;
};

const generateXml = (entries: SitemapEntry[]) =>
  `<?xml version="1.0" encoding="UTF-8"?>
     <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
       ${entries
         .map(
           (entry) => `
         <url>
           <loc>${entry.url}</loc>
           <lastmod>${new Date(
             entry.lastModified || new Date()
           ).toISOString()}</lastmod>
           <changefreq>${entry.changeFrequency}</changefreq>
           <priority>${entry.priority}</priority>
         </url>
       `
         )
         .join("")}
     </urlset>`;

export async function GET() {
  try {
    // MODIFIED: Correctly destructure to get the `leagues` array from the response data.
    // We fetch with a very large limit to get all leagues for the sitemap.
    const {
      data: { leagues },
    } = await axios.get(
      `${BASE_URL}/api/directory/standings-leagues?limit=10000`
    );

    // ADDED: A robust safety check to prevent crashes if the API response is malformed.
    if (!leagues || !Array.isArray(leagues)) {
      console.error(
        "[SITEMAP-STANDINGS] API did not return a valid leagues array."
      );
      // Return an empty sitemap to prevent a 500 error.
      return new Response(generateXml([]), {
        headers: { "Content-Type": "application/xml" },
      });
    }

    const sitemapEntries: SitemapEntry[] = leagues.flatMap((league: any) =>
      // Create an entry for each supported language
      SUPPORTED_LOCALES.map((locale) => ({
        url: getUrl(league.href, locale),
        lastModified: new Date(),
        changeFrequency: "daily",
        priority: 0.8,
      }))
    );

    const xml = generateXml(sitemapEntries);

    return new Response(xml, {
      headers: {
        "Content-Type": "application/xml",
      },
    });
  } catch (error) {
    console.error("[SITEMAP-STANDINGS] Error generating sitemap:", error);
    return new Response("Error generating standings sitemap.", { status: 500 });
  }
}
