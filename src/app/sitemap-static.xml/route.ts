// No import from 'next/server' needed for MetadataRoute

const BASE_URL =
  process.env.NEXT_PUBLIC_PUBLIC_APP_URL || "http://localhost:3000";

// This list must be kept in sync with middleware.ts
const SUPPORTED_LOCALES = ["tr", "en", "fr", "es", "zu"];
const DEFAULT_LOCALE = "tr";

// 1. Manually define the type for a sitemap entry
type SitemapEntry = {
  url: string;
  lastModified?: string | Date;
  changeFrequency?:
    | "always"
    | "hourly"
    | "daily"
    | "weekly"
    | "monthly"
    | "yearly"
    | "never";
  priority?: number;
};

const getPath = (path: string, locale: string) => {
  if (locale === DEFAULT_LOCALE) {
    return path === "/" ? "" : path;
  }
  return `/${locale}${path}`;
};

export async function GET() {
  const staticPaths = [
    { path: "/", priority: 1.0, changeFrequency: "daily" },
    { path: "/football/news", priority: 0.9, changeFrequency: "daily" },
    { path: "/news", priority: 0.9, changeFrequency: "daily" },
    { path: "/football/leagues", priority: 0.9, changeFrequency: "daily" },
    { path: "/football/teams", priority: 0.9, changeFrequency: "daily" },
    { path: "/contact-us", priority: 0.5, changeFrequency: "monthly" },
    { path: "/faq", priority: 0.6, changeFrequency: "monthly" },
    { path: "/author", priority: 0.4, changeFrequency: "yearly" },
    { path: "/report-abuse", priority: 0.4, changeFrequency: "yearly" },
    { path: "/privacy-policy", priority: 0.3, changeFrequency: "yearly" },
    { path: "/terms-and-conditions", priority: 0.3, changeFrequency: "yearly" },
    { path: "/gdpr", priority: 0.3, changeFrequency: "yearly" },
  ];

  // 2. Use our custom type here
  const sitemapEntries: SitemapEntry[] = staticPaths.flatMap((page) =>
    SUPPORTED_LOCALES.map((locale) => ({
      url: `${BASE_URL}${getPath(page.path, locale)}`,
      lastModified: new Date(),
      changeFrequency: page.changeFrequency as SitemapEntry["changeFrequency"],
      priority: page.priority,
    }))
  );

  // 3. And use it here as well
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

  const xml = generateXml(sitemapEntries);

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml",
    },
  });
}
