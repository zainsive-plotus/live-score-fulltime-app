import slugify from "slugify";

interface Team {
  name: string;
}

/**
 * Generates a non-prefixed, SEO-friendly slug for a match.
 * The StyledLink component will handle adding the locale prefix.
 * @param homeTeam - The home team object.
 * @param awayTeam - The away team object.
 * @param fixtureId - The ID of the fixture.
 * @returns The partial URL path without locale (e.g., '/football/match/manchester-united-vs-liverpool-12345').
 */
export function generateMatchSlug(
  homeTeam: Team,
  awayTeam: Team,
  fixtureId: number
): string {
  const homeName = homeTeam?.name || "team";
  const awayName = awayTeam?.name || "team";

  const homeSlug = slugify(homeName, {
    lower: true,
    strict: true,
    remove: /[*+~.()'"!:@]/g,
  });
  const awaySlug = slugify(awayName, {
    lower: true,
    strict: true,
    remove: /[*+~.()'"!:@]/g,
  });

  return `/football/match/${homeSlug}-vs-${awaySlug}-${fixtureId}`;
}
