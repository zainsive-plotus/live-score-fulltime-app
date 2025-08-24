// ===== src/app/sitemap-matches.xml/route.ts =====

import axios from "axios";
import slugify from "slugify";
import { format, subDays, addDays } from "date-fns";

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

const generateMatchSlug = (
  homeName: string,
  awayName: string,
  fixtureId: number
): string => {
  const slugifyPart = (str: string) =>
    slugify(str, { lower: true, strict: true, remove: /[*+~.()'"!:@]/g });
  return `/football/match/${slugifyPart(homeName)}-vs-${slugifyPart(
    awayName
  )}-${fixtureId}`;
};

// ** FIX 1: Cleaned up XML generation to remove unnecessary whitespace. **
const generateXml = (entries: SitemapEntry[]) =>
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${entries
    .map(
      (entry) =>
        `<url><loc>${entry.url}</loc><lastmod>${new Date(
          entry.lastModified || new Date()
        ).toISOString()}</lastmod><changefreq>${
          entry.changeFrequency
        }</changefreq><priority>${entry.priority}</priority></url>`
    )
    .join("")}</urlset>`;

export async function GET() {
  try {
    const today = new Date();
    const fromDate = format(subDays(today, 30), "yyyy-MM-dd");
    const toDate = format(addDays(today, 30), "yyyy-MM-dd");

    const { data: matches } = await axios.get(
      `${BASE_URL}/api/fixtures?from=${fromDate}&to=${toDate}`
    );

    // ** FIX 2: Add a defensive filter to ensure all match objects are valid before processing. **
    const validMatches = matches.filter(
      (match: any) =>
        match &&
        match.fixture?.id &&
        match.teams?.home?.name &&
        match.teams?.away?.name
    );

    const sitemapEntries: SitemapEntry[] = validMatches.flatMap((match: any) =>
      SUPPORTED_LOCALES.map((locale) => ({
        url: `${BASE_URL}${getPath(
          generateMatchSlug(
            match.teams.home.name,
            match.teams.away.name,
            match.fixture.id
          ),
          locale
        )}`,
        lastModified: new Date(match.fixture.date),
        changeFrequency: "daily",
        priority: 0.9,
      }))
    );

    const xml = generateXml(sitemapEntries);

    return new Response(xml, {
      headers: {
        "Content-Type": "application/xml",
      },
    });
  } catch (error) {
    console.error("[Sitemap] Failed to fetch match URLs:", error);
    return new Response("Error generating sitemap.", { status: 500 });
  }
}
