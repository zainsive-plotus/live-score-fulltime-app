// ===== src/lib/generate-standings-slug.ts =====

import slugify from "slugify";

/**
 * Generates the slug part for a league's standings page URL.
 * Example: "Bundesliga", 78 => "bundesliga-78"
 */
export function generateStandingsSlug(name: string, id: number): string {
  const nameSlug = slugify(name, {
    lower: true,
    strict: true,
    trim: true,
    remove: /[*+~.()'"!:@]/g,
  });
  return `${nameSlug}-${id}`;
}
