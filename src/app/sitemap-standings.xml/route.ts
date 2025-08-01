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

// Helper to construct the full URL with locale prefix if needed
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
    // Fetch the same curated list of leagues that have standings pages
    const { data: leagues } = await axios.get(
      `${BASE_URL}/api/directory/standings-leagues`
    );

    if (!leagues || leagues.length === 0) {
      return new Response(generateXml([]), {
        headers: { "Content-Type": "application/xml" },
      });
    }

    const sitemapEntries: SitemapEntry[] = leagues.flatMap((league: any) =>
      // Create an entry for each supported language
      SUPPORTED_LOCALES.map((locale) => ({
        url: getUrl(league.href, locale),
        lastModified: new Date(),
        changeFrequency: "daily", // Standings change frequently
        priority: 0.8, // High priority as these are key pages
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
