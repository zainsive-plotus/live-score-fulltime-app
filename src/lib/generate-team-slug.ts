import slugify from "slugify";

/**
 * Generates a locale-prefixed, SEO-friendly slug for a team.
 * @param teamName - The name of the team.
 * @param teamId - The ID of the team.
 * @param locale - The locale to prefix the URL with (e.g., 'en', 'tr').
 * @returns The complete, prefixed URL path (e.g., '/en/football/team/manchester-united-33').
 */
export const generateTeamSlug = (
  teamName: string,
  teamId: number,
  locale?: string
) => {
  const slug = slugify(teamName, {
    lower: true,
    strict: true,
    remove: /[*+~.()'"!:@]/g,
  });
  if (locale) return `/${locale}/football/team/${slug}-${teamId}`;
  else return `/football/team/${slug}-${teamId}`;
};
