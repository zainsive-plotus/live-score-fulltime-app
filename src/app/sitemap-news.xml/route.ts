// ===== src/app/sitemap-news.xml/route.ts =====

import { IPost } from "@/models/Post";
import dbConnect from "@/lib/dbConnect";
import Post from "@/models/Post";
import { DEFAULT_LOCALE } from "@/lib/i18n/config";

// ***** FIX #1: Force this route to run in the Node.js runtime *****
export const dynamic = "force-dynamic";

const BASE_URL =
  process.env.NEXT_PUBLIC_PUBLIC_APP_URL || "http://localhost:3000";

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
    // ***** FIX #2: Fetch data directly from the database *****
    await dbConnect();
    const posts: IPost[] = await Post.find({ status: "published" }).lean();

    const sitemapEntries: SitemapEntry[] = posts.map((post) => {
      const basePath = `/news/${post.slug}`;
      const finalPath = getPath(basePath, post.language);

      return {
        url: `${BASE_URL}${finalPath}`,
        lastModified: new Date(post.updatedAt || post.createdAt),
        changeFrequency: "weekly",
        priority: 0.8,
      };
    });

    const xml = generateXml(sitemapEntries);

    return new Response(xml, {
      headers: {
        "Content-Type": "application/xml",
      },
    });
  } catch (error) {
    console.error("[SITEMAP-NEWS] Error generating sitemap:", error);
    return new Response("Error generating sitemap.", { status: 500 });
  }
}
