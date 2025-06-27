import slugify from 'slugify';

/**
 * Generates a URL-friendly slug for a league.
 * e.g., "Premier League", 39 -> "/league/premier-league-39"
 * @param name - The name of the league.
 * @param id - The unique ID of the league.
 * @returns A string representing the path.
 */
export function generateLeagueSlug(name: string, id: number): string {
  const nameSlug = slugify(name, {
    lower: true,    // convert to lower case
    strict: true,   // remove special characters
    trim: true,     // trim leading/trailing spaces
  });
  
  return `/football/league/${nameSlug}-${id}`;
}