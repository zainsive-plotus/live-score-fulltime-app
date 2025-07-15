import slugify from "slugify";

/**
 * Generates a locale-prefixed, SEO-friendly slug for a league.
 * @param name - The name of the league.
 * @param id - The ID of the league.
 * @param locale - The locale to prefix the URL with (e.g., 'en', 'tr').
 * @returns The complete, prefixed URL path (e.g., '/en/football/league/premier-league-39').
 */
export function generateLeagueSlug(
  name: string,
  id: number,
  locale?: string
): any {
  const nameSlug = slugify(name, {
    lower: true,
    strict: true,
    trim: true,
    remove: /[*+~.()'"!:@]/g,
  });

  if (locale) return `/${locale}/football/league/${nameSlug}-${id}`;
  else return `/football/league/${nameSlug}-${id}`;
}
