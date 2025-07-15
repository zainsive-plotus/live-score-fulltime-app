const BASE_URL =
  process.env.NEXT_PUBLIC_PUBLIC_APP_URL || "http://localhost:3000";

const generateSitemapIndexXml = () => {
  const sitemaps = [
    "sitemap-static.xml",
    "sitemap-news.xml",
    "sitemap-leagues.xml",
    "sitemap-teams.xml",
    "sitemap-matches.xml",
  ];

  const sitemapEntries = sitemaps
    .map(
      (route) => `
    <sitemap>
      <loc>${BASE_URL}/${route}</loc>
      <lastmod>${new Date().toISOString()}</lastmod>
    </sitemap>
  `
    )
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
    <sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      ${sitemapEntries}
    </sitemapindex>
  `;
};

export async function GET() {
  const xml = generateSitemapIndexXml();

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml",
    },
  });
}
