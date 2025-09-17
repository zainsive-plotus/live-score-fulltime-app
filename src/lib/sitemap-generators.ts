// ===== src/lib/sitemap-generators.ts =====
import "server-only";
import dbConnect from "@/lib/dbConnect";
import Post from "@/models/Post";
import Team from "@/models/Team";
import League from "@/models/League";
import { getFixturesByDateRange } from "@/lib/data/fixtures";
import { generatePlayerSlug } from "@/lib/generate-player-slug";
import { generateLeagueSlug } from "@/lib/generate-league-slug";
import { generateTeamSlug } from "@/lib/generate-team-slug";
import { generateMatchSlug } from "@/lib/generate-match-slug";
import { generateStandingsSlug } from "@/lib/generate-standings-slug";
import { format, subDays, addDays } from "date-fns";
import axios from "axios";

const BASE_URL =
  process.env.NEXT_PUBLIC_PUBLIC_APP_URL || "http://localhost:3000";
const API_HOST = process.env.NEXT_PUBLIC_API_FOOTBALL_HOST;
const API_KEY = process.env.NEXT_PUBLIC_API_FOOTBALL_KEY;

// --- XML Generation Helper ---
const generateXml = (
  entries: any[],
  changeFrequency: string,
  priority: number
) => {
  const urls = entries
    .map(
      (entry) => `
    <url>
      <loc>${entry.url}</loc>
      <lastmod>${new Date(
        entry.lastModified || new Date()
      ).toISOString()}</lastmod>
      <changefreq>${changeFrequency}</changefreq>
      <priority>${priority}</priority>
    </url>
  `
    )
    .join("");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`;
};

// --- Sitemap Generators ---

export async function generateCoreSitemap(locale: string) {
  const staticPaths = [
    "/",
    "/football/news",
    "/news",
    "/football/leagues",
    "/football/teams",
    "/contact-us",
    "/faq",
    "/author",
    "/privacy-policy",
    "/terms-and-conditions",
    "/gdpr",
    "/predictions",
    "/highlights",
  ];
  const entries = staticPaths.map((path) => ({
    url: `${BASE_URL}/${locale}${path}`,
  }));
  return generateXml(entries, "daily", 1.0);
}

export async function generateNewsSitemap(locale: string) {
  await dbConnect();
  const posts = await Post.find({ language: locale, status: "published" })
    .select("slug updatedAt")
    .lean();
  const entries = posts.map((post) => ({
    url: `${BASE_URL}/${locale}/news/${post.slug}`,
    lastModified: post.updatedAt,
  }));
  return generateXml(entries, "weekly", 0.8);
}

export async function generateLeaguesSitemap(locale: string) {
  await dbConnect();
  const leagues = await League.find({}).select("name leagueId").lean();
  const entries = leagues.map((l) => ({
    url: `${BASE_URL}/${locale}${generateLeagueSlug(l.name, l.leagueId)}`,
  }));
  return generateXml(entries, "weekly", 0.7);
}

export async function generateTeamsSitemap(locale: string) {
  await dbConnect();
  const teams = await Team.find({}).select("name teamId").lean();
  const entries = teams.map((t) => ({
    url: `${BASE_URL}/${locale}${generateTeamSlug(t.name, t.teamId)}`,
  }));
  return generateXml(entries, "weekly", 0.6);
}

export async function generatePlayersSitemap(locale: string) {
  //   await dbConnect();
  //   // Assuming you have a Player model now
  //   const Player = mongoose.models.Player || require("@/models/Player").default;
  //   const players = await Player.find({}).select("name playerId").lean();
  //   const entries = players.map((p) => ({
  //     url: `${BASE_URL}/${locale}${generatePlayerSlug(p.name, p.playerId)}`,
  //   }));
  //   return generateXml(entries, "weekly", 0.5);
}

export async function generateMatchesSitemap(locale: string) {
  const today = new Date();
  const fromDate = format(subDays(today, 1), "yyyy-MM-dd");
  const toDate = format(addDays(today, 2), "yyyy-MM-dd");
  const matches = await getFixturesByDateRange(fromDate, toDate);
  const validMatches = matches.filter(
    (m) => m && m.fixture?.id && m.teams?.home?.name && m.teams?.away?.name
  );
  const entries = validMatches.map((m) => ({
    url: `${BASE_URL}/${locale}${generateMatchSlug(
      m.teams.home,
      m.teams.away,
      m.fixture.id
    )}`,
    lastModified: m.fixture.date,
  }));
  return generateXml(entries, "daily", 0.9);
}

export async function generateStandingsSitemap(locale: string) {
  const { data } = await axios.get(
    `${BASE_URL}/api/directory/standings-leagues?limit=10000`
  );
  const entries = data.leagues.map((l: any) => ({
    url: `${BASE_URL}/${locale}${l.href}`,
  }));
  return generateXml(entries, "daily", 0.8);
}
