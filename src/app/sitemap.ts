// src/app/sitemap.ts
import { MetadataRoute } from "next";
import axios from "axios";
import { format, subDays, addDays } from "date-fns"; // For match dates

// Ensure these are correctly imported or defined in src/lib/ if they are not already
// Example definitions if they are not in src/lib (but it's better if they are)
// import { generateLeagueSlug } from '@/lib/generate-league-slug';
// import { generateTeamSlug } from '@/lib/generate-team-slug';
// import { generateMatchSlug } from '@/lib/generate-match-slug';
import slugify from "slugify"; // Assuming slugify is used internally by your generate functions

// --- IMPORTANT: Ensure NEXTAUTH_URL is set in your .env.local or production environment ---
// This is the base URL for your deployed application.
const BASE_URL = process.env.NEXTAUTH_URL || "http://localhost:3000";

// --- Helper Functions to build slugs (ensure they match your frontend) ---
// If these are already in src/lib, you can import them instead of defining here.
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

// Fetches published news articles
async function getNewsUrls(): Promise<MetadataRoute.Sitemap> {
  try {
    const { data: posts } = await axios.get(
      `${BASE_URL}/api/posts?status=published`
    );
    return posts.map((post: any) => ({
      url: `${BASE_URL}/football/news/${post.slug}`,
      lastModified: post.updatedAt
        ? new Date(post.updatedAt)
        : new Date(post.createdAt), // Use actual update/create date
      changeFrequency: "weekly",
      priority: 0.8,
    }));
  } catch (error) {
    console.error("Error generating news sitemap:", error);
    return [];
  }
}

// Fetches all leagues (including less popular ones if fetchAll=true works globally)
async function getLeagueUrls(): Promise<MetadataRoute.Sitemap> {
  try {
    const { data: leagues } = await axios.get(
      `${BASE_URL}/api/leagues?fetchAll=true`
    );
    return leagues.map((league: any) => ({
      url: `${BASE_URL}${generateLeagueSlug(league.name, league.id)}`,
      lastModified: new Date(), // Leagues typically don't have update timestamps from API-Football
      changeFrequency: "monthly",
      priority: 0.7,
    }));
  } catch (error) {
    console.error("Error generating league sitemap:", error);
    return [];
  }
}

// Fetches teams from the directory API (which gets from popular leagues)
// This is a practical compromise for sitemaps due to the sheer volume of teams.
async function getTeamUrls(): Promise<MetadataRoute.Sitemap> {
  try {
    const { data: teamsData } = await axios.get(
      `${BASE_URL}/api/directory/teams`
    );
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
    console.error("Error generating team sitemap:", error);
    return [];
  }
}

// Fetches a range of recent and upcoming matches.
// Fetching *all* historical matches is not feasible via API-Football for sitemaps.
async function getMatchUrls(): Promise<MetadataRoute.Sitemap> {
  try {
    const today = new Date();
    const fromDate = format(subDays(today, 60), "yyyy-MM-dd"); // Last 60 days
    const toDate = format(addDays(today, 60), "yyyy-MM-dd"); // Next 60 days

    // Use the global fixtures endpoint to get a broad range of matches
    const { data: matches } = await axios.get(
      `${BASE_URL}/api/fixtures?from=${fromDate}&to=${toDate}`
    );

    return matches.map((match: any) => ({
      url: `${BASE_URL}${generateMatchSlug(
        match.teams.home.name,
        match.teams.away.name,
        match.fixture.id
      )}`,
      lastModified: new Date(match.fixture.date), // Use fixture date as last modified
      changeFrequency: "daily",
      priority: 0.9,
    }));
  } catch (error) {
    console.error("Error generating match sitemap:", error);
    return [];
  }
}

// --- Main sitemap generation function ---
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Fetch all URLs concurrently for performance
  const [newsUrls, leagueUrls, teamUrls, matchUrls] = await Promise.all([
    getNewsUrls(),
    getLeagueUrls(),
    getTeamUrls(),
    getMatchUrls(),
  ]);

  // Combine all URLs, starting with static/root pages
  return [
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
    // Spread the dynamically generated URLs
    ...newsUrls,
    ...leagueUrls,
    ...teamUrls,
    ...matchUrls,
  ];
}
