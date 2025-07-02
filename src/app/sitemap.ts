// src/app/sitemap.ts
// This is the full, dynamic sitemap.ts file.

import { MetadataRoute } from "next";
import axios from "axios";
import { format, subDays, addDays } from "date-fns";
import slugify from "slugify";

// --- IMPORTANT: This is the critical part for production deployment ---
// Ensure NEXT_PUBLIC_PUBLIC_APP_URL is set in your production environment variables.
const BASE_URL =
  process.env.NEXT_PUBLIC_PUBLIC_APP_URL || "http://localhost:3000";
console.log(`[Sitemap Generation] BASE_URL is: ${BASE_URL}`);

// --- Helper Functions to build slugs (ensure they match your frontend) ---
const generateLeagueSlug = (leagueName: string, leagueId: number): string => {
  const slug = slugify(leagueName, {
    lower: true,
    strict: true,
    remove: /[*+~.()'"!:@]/g,
  });
  return `/football/league/${slug}-${leagueId}`;
};

const generateTeamSlug = (teamName: string, teamId: number): string => {
  const slug = slugify(teamName, {
    lower: true,
    strict: true,
    remove: /[*+~.()'"!:@]/g,
  });
  return `/football/team/${slug}-${teamId}`;
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

// --- Fetchers for each content type ---

async function getNewsUrls(): Promise<MetadataRoute.Sitemap> {
  console.log(
    `[Sitemap] Fetching news from: ${BASE_URL}/api/posts?status=published`
  );
  try {
    const { data: posts } = await axios.get(
      `${BASE_URL}/api/posts?status=published`
    );
    console.log(`[Sitemap] Fetched ${posts.length} news posts.`);
    return posts.map((post: any) => ({
      url: `${BASE_URL}/football/news/${post.slug}`,
      lastModified: post.updatedAt
        ? new Date(post.updatedAt)
        : new Date(post.createdAt),
      changeFrequency: "weekly",
      priority: 0.8,
    }));
  } catch (error) {
    console.error("[Sitemap] Error generating news sitemap:", error);
    return [];
  }
}

async function getLeagueUrls(): Promise<MetadataRoute.Sitemap> {
  console.log(
    `[Sitemap] Fetching leagues from: ${BASE_URL}/api/leagues?fetchAll=true`
  );
  try {
    const { data: leagues } = await axios.get(
      `${BASE_URL}/api/leagues?fetchAll=true`
    );
    console.log(`[Sitemap] Fetched ${leagues.length} leagues.`);
    return leagues.map((league: any) => ({
      url: `${BASE_URL}${generateLeagueSlug(league.name, league.id)}`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    }));
  } catch (error) {
    console.error("[Sitemap] Error generating league sitemap:", error);
    return [];
  }
}

async function getTeamUrls(): Promise<MetadataRoute.Sitemap> {
  console.log(`[Sitemap] Fetching teams from: ${BASE_URL}/api/directory/teams`);
  try {
    const { data: teamsData } = await axios.get(
      `${BASE_URL}/api/directory/teams`
    );
    console.log(`[Sitemap] Fetched ${teamsData.length} teams.`);
    return teamsData.map((teamData: any) => ({
      url: `${BASE_URL}${generateTeamSlug(
        teamData.team.name,
        teamData.team.id
      )}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.6,
    }));
  } catch (error) {
    console.error("[Sitemap] Error generating team sitemap:", error);
    return [];
  }
}

async function getMatchUrls(): Promise<MetadataRoute.Sitemap> {
  const today = new Date();
  const fromDate = format(subDays(today, 60), "yyyy-MM-dd");
  const toDate = format(addDays(today, 60), "yyyy-MM-dd");
  console.log(
    `[Sitemap] Fetching matches from: ${BASE_URL}/api/fixtures?from=${fromDate}&to=${toDate}`
  );
  try {
    const { data: matches } = await axios.get(
      `${BASE_URL}/api/fixtures?from=${fromDate}&to=${toDate}`
    );
    console.log(`[Sitemap] Fetched ${matches.length} matches.`);
    return matches.map((match: any) => ({
      url: `${BASE_URL}${generateMatchSlug(
        match.teams.home.name,
        match.teams.away.name,
        match.fixture.id
      )}`,
      lastModified: new Date(match.fixture.date),
      changeFrequency: "daily",
      priority: 0.9,
    }));
  } catch (error) {
    console.error("[Sitemap] Error generating match sitemap:", error);
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  console.log("[Sitemap] Starting sitemap generation...");
  const [newsUrls, leagueUrls, teamUrls, matchUrls] = await Promise.all([
    getNewsUrls(),
    getLeagueUrls(),
    getTeamUrls(),
    getMatchUrls(),
  ]);

  const allUrls = [
    {
      url: `${BASE_URL}/`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${BASE_URL}/football/news`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/football/leagues`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/football/teams`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    ...newsUrls,
    ...leagueUrls,
    ...teamUrls,
    ...matchUrls,
  ];

  console.log(
    `[Sitemap] Finished sitemap generation. Total URLs: ${allUrls.length}`
  );
  return allUrls;
}
