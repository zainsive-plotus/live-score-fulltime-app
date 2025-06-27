// src/lib/generate-team-slug.ts
import slugify from "slugify";

export const generateTeamSlug = (teamName: string, teamId: number): string => {
  const slug = slugify(teamName, {
    lower: true,
    strict: true,
    remove: /[*+~.()'"!:@]/g,
  });
  return `/football/team/${slug}-${teamId}`;
};
