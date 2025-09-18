// ===== src/app/api/admin/sitemaps/generate/route.ts =====
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import path from "path";
import fs from "fs/promises";
import { SUPPORTED_LOCALES } from "@/lib/i18n/config";
import {
  generateCoreSitemap,
  generateNewsSitemap,
  generateLeaguesSitemap,
  generateTeamsSitemap,
  //   generatePlayersSitemap,
  generateMatchesSitemap,
  generateStandingsSitemap,
} from "@/lib/sitemap-generators"; // We will continue to use our organized generator functions

const SITEMAP_DIR = path.join(process.cwd(), "public", "sitemap");

const SITEMAP_TYPES = [
  "core",
  "news",
  "leagues",
  "teams",
  "players",
  "matches",
  "standings",
];

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const generatedFiles: string[] = [];
    const failedFiles: string[] = [];

    await fs.mkdir(SITEMAP_DIR, { recursive: true });

    for (const locale of SUPPORTED_LOCALES) {
      const localeDir = path.join(SITEMAP_DIR, locale);
      await fs.mkdir(localeDir, { recursive: true });

      for (const type of SITEMAP_TYPES) {
        const filePath = path.join(localeDir, `${type}.xml`);
        try {
          const generatorMap: {
            [key: string]: (locale: string) => Promise<string>;
          } = {
            core: generateCoreSitemap,
            news: generateNewsSitemap,
            leagues: generateLeaguesSitemap,
            teams: generateTeamsSitemap,
            // players: generatePlayersSitemap,
            matches: generateMatchesSitemap,
            standings: generateStandingsSitemap,
          };

          const xmlContent = await generatorMap[type](locale);
          await fs.writeFile(filePath, xmlContent, "utf-8");
          generatedFiles.push(`/sitemap/${locale}/${type}.xml`);
        } catch (error) {
          console.error(
            `[Sitemap Generation] Failed to generate ${filePath}:`,
            error
          );
          failedFiles.push(`/sitemap/${locale}/${type}.xml`);
        }
      }
    }

    return NextResponse.json({
      message: `Sitemap generation complete. ${generatedFiles.length} files created, ${failedFiles.length} failed.`,
      generatedFiles,
      failedFiles,
    });
  } catch (error: any) {
    console.error("[Sitemap Generation] A critical error occurred:", error);
    return NextResponse.json(
      { error: "Failed to generate sitemaps.", details: error.message },
      { status: 500 }
    );
  }
}
