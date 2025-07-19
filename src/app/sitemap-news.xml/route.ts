import axios from "axios";
import { IPost } from "@/models/Post";

const BASE_URL =
  process.env.NEXT_PUBLIC_PUBLIC_APP_URL || "http://localhost:3000";

// We no longer need the full list of locales here, only the default.
const DEFAULT_LOCALE = "tr";

type SitemapEntry = {
  url: string;
  lastModified?: string | Date;
  changeFrequency?: "daily" | "weekly" | "monthly";
  priority?: number;
};

const getPath = (path: string, locale: string) => {
  // This helper function remains correct. It adds a prefix if the locale is not the default.
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

    // --- START OF FIX ---
    // Instead of flatMap, we use a simple map.
    // For each post, we generate only ONE sitemap entry.
    const sitemapEntries: SitemapEntry[] = posts.map((post) => {
      // The canonical path is always /news/[slug]
      const basePath = `/news/${post.slug}`;

      // We use the post's OWN language to generate the correct path.
      const finalPath = getPath(basePath, post.language);

      return {
        url: `${BASE_URL}${finalPath}`,
        lastModified: new Date(post.updatedAt || post.createdAt),
        changeFrequency: "weekly",
        priority: 0.8,
      };
    });
    // --- END OF FIX ---

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
