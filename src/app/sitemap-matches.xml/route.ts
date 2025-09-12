// ===== src/app/sitemap-matches.xml/route.ts =====

import slugify from "slugify";
import { format, subDays, addDays } from "date-fns";
// --- CORE CHANGE: Import the direct data fetcher ---
import { getFixturesByDateRange } from "@/lib/data/fixtures";

const BASE_URL =
  process.env.NEXT_PUBLIC_PUBLIC_APP_URL || "http://localhost:3000";

const SUPPORTED_LOCALES = ["tr", "en", "fr", "es", "zu", "it"];
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

const generateXml = (entries: SitemapEntry[]) =>
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${entries
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
    const fromDate = format(subDays(today, 1), "yyyy-MM-dd");
    const toDate = format(addDays(today, 2), "yyyy-MM-dd");

    // --- CORE CHANGE: Call the direct data fetching function instead of the internal API ---
    const matches = await getFixturesByDateRange(fromDate, toDate);

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
      status: 200,
      headers: {
        "Content-Type": "application/xml",
        "Cache-Control": "s-maxage=3600, stale-while-revalidate",
      },
    });
  } catch (error) {
    console.error("[Sitemap/Matches] Error generating sitemap:", error);
    return new Response("Error generating sitemap.", { status: 500 });
  }
}
