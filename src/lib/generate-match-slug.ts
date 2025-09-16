import slugify from "slugify";

interface Team {
  name: string;
}

// This function now only takes the essential parts and creates a clean slug.
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
