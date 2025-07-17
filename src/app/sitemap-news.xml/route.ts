import axios from "axios";
import { IPost } from "@/models/Post"; // Assuming IPost is available here or define it

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
  if (locale === DEFAULT_LOCALE) {
    return path;
  }
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
    const { data: posts }: { data: IPost[] } = await axios.get(
      `${BASE_URL}/api/posts?status=published`
    );

    const sitemapEntries: SitemapEntry[] = posts.flatMap((post) => {
      // Determine the correct path based on the sports category
      const isFootballNews = post.sportsCategory.includes("football");
      const basePath = isFootballNews
        ? `/football/news/${post.slug}`
        : `/news/${post.slug}`;

      return SUPPORTED_LOCALES.map((locale) => ({
        url: `${BASE_URL}${getPath(basePath, locale)}`,
        lastModified: new Date(post.updatedAt || post.createdAt),
        changeFrequency: "weekly",
        priority: 0.8,
      }));
    });

    const xml = generateXml(sitemapEntries);

    return new Response(xml, {
      headers: {
        "Content-Type": "application/xml",
      },
    });
  } catch (error) {
    console.error("Error generating news sitemap:", error);
    return new Response("Error generating sitemap.", { status: 500 });
  }
}
