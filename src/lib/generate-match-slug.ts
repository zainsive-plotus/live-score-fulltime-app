// src/lib/generate-match-slug.ts
import slugify from 'slugify';

interface Team {
  name: string;
}

// The function now requires the fixture ID
export function generateMatchSlug(homeTeam: Team, awayTeam: Team, fixtureId: number): string {
  const homeName = homeTeam?.name || 'team';
  const awayName = awayTeam?.name || 'team';
  
  const homeSlug = slugify(homeName, { lower: true, strict: true });
  const awaySlug = slugify(awayName, { lower: true, strict: true });

  // Append the unique ID to the end of the slug
  return `${homeSlug}-vs-${awaySlug}-${fixtureId}`;
}