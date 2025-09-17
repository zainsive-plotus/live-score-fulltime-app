// ===== src/app/sitemap.xml/route.ts =====
import { SUPPORTED_LOCALES } from "@/lib/i18n/config";

const BASE_URL =
  process.env.NEXT_PUBLIC_PUBLIC_APP_URL || "http://localhost:3000";

const generateSitemapIndexXml = () => {
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

  SUPPORTED_LOCALES.forEach((locale) => {
    contentTypes.forEach((type) => {
      sitemapEntries += `
    <sitemap>
      <loc>${BASE_URL}/sitemap/${locale}/${type}.xml</loc>
      <lastmod>${new Date().toISOString()}</lastmod>
    </sitemap>
  `;
    });
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
    <sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      ${sitemapEntries}
    </sitemapindex>
  `;
};

export async function GET() {
  const xml = generateSitemapIndexXml();
  return new Response(xml, {
    headers: { "Content-Type": "application/xml" },
  });
}
