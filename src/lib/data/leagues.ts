// ===== src/lib/data/leagues.ts =====

import "server-only";
import dbConnect from "@/lib/dbConnect";
import League from "@/models/League";
import { generateLeagueSlug } from "@/lib/generate-league-slug";

// This function contains the logic to get all leagues from the database for the sitemap.
export async function getAllLeaguesForSitemap() {
  try {
    await dbConnect();

    // Fetch only the fields needed for the sitemap to be efficient
    const leagues = await League.find({})
      .select("name leagueId")
      .sort({ name: 1 })
      .lean();

    // Transform data right here to include the generated slug
    return leagues.map((league) => ({
      name: league.name,
      id: league.leagueId,
      // The generateLeagueSlug function returns the full path, e.g., /football/league/premier-league-39
      slug: generateLeagueSlug(league.name, league.leagueId),
    }));
  } catch (error) {
    console.error(
      `[data/leagues] Error fetching all leagues for sitemap:`,
      error
    );
    return []; // Always return an empty array on failure
  }
}
