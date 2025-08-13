// ===== src/app/sitemap-leagues.xml/route.ts =====

import { getAllLeaguesForSitemap } from "@/lib/data/leagues"; // <-- CORRECTED IMPORT PATH

const BASE_URL =
  process.env.NEXT_PUBLIC_PUBLIC_APP_URL || "http://localhost:3000";

const SUPPORTED_LOCALES = ["tr", "en", "fr", "es", "zu"];
const DEFAULT_LOCALE = "tr";

type SitemapEntry = {
  url: string;
  lastModified?: string | Date;
  changeFrequency?: "daily" | "weekly" | "monthly";
  priority?: number;
};

const getPath = (path: string, locale: string) => {
  if (locale === DEFAULT_LOCALE) return path;
  return `/${locale}${path}`;
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
    // Instead of using axios, we import the function directly.
    const leagues = await getAllLeaguesForSitemap();

    const sitemapEntries: SitemapEntry[] = leagues.flatMap((league: any) =>
      SUPPORTED_LOCALES.map((locale) => ({
        // The data now includes the pre-generated slug (full path)
        url: `${BASE_URL}${getPath(league.slug, locale)}`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.7,
      }))
    );

    const xml = generateXml(sitemapEntries);

    return new Response(xml, {
      headers: {
        "Content-Type": "application/xml",
      },
    });
  } catch (error) {
    console.error("[sitemap-leagues] Error generating sitemap:", error);
    return new Response("Error generating sitemap.", { status: 500 });
  }
}
