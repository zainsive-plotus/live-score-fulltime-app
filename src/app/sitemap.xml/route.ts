// ===== src/app/sitemap.xml/route.ts =====
import { SUPPORTED_LOCALES } from "@/lib/i18n/config";

const BASE_URL =
  process.env.NEXT_PUBLIC_PUBLIC_APP_URL || "http://localhost:3000";

// This function will now be responsible for generating the main sitemap index.
export async function GET() {
  const contentTypes = [
    "core",
    "news",
    "leagues",
    "teams",
    "players",
    "matches",
    "standings",
  ];

  let sitemapEntries = "";

  // Loop through all supported languages and content types to build the index
  SUPPORTED_LOCALES.forEach((locale) => {
    contentTypes.forEach((type) => {
      // This path now correctly points to the static files that will be generated
      // in the /public/sitemap/{locale}/{type}.xml directory.
      sitemapEntries += `
    <sitemap>
      <loc>${BASE_URL}/sitemap/${locale}/${type}.xml</loc>
      <lastmod>${new Date().toISOString()}</lastmod>
    </sitemap>
  `;
    });
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
    <sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      ${sitemapEntries}
    </sitemapindex>
  `;

  return new Response(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "s-maxage=86400, stale-while-revalidate", // Cache for 24 hours
    },
  });
}
