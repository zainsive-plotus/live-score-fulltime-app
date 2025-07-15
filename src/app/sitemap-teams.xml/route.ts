import axios from "axios";
import slugify from "slugify";

const BASE_URL =
  process.env.NEXT_PUBLIC_PUBLIC_APP_URL || "http://localhost:3000";

const SUPPORTED_LOCALES = ["tr", "en", "de", "fr", "es", "ar", "zu"];
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

const generateTeamSlug = (name: string, id: number): string => {
  const slug = slugify(name, {
    lower: true,
    strict: true,
    remove: /[*+~.()'"!:@]/g,
  });
  return `/football/team/${slug}-${id}`;
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
    const { data: teamsData } = await axios.get(
      `${BASE_URL}/api/directory/teams`
    );

    const sitemapEntries: SitemapEntry[] = teamsData.flatMap((teamData: any) =>
      SUPPORTED_LOCALES.map((locale) => ({
        url: `${BASE_URL}${getPath(
          generateTeamSlug(teamData.team.name, teamData.team.id),
          locale
        )}`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.6,
      }))
    );

    const xml = generateXml(sitemapEntries);

    return new Response(xml, {
      headers: {
        "Content-Type": "application/xml",
      },
    });
  } catch (error) {
    console.error("[Sitemap] Failed to fetch team URLs:", error);
    return new Response("Error generating sitemap.", { status: 500 });
  }
}
