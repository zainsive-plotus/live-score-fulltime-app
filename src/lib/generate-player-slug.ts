// ===== src/lib/generate-player-slug.ts =====
import slugify from "slugify";

export const generatePlayerSlug = (
  playerName: string,
  playerId: number
): string => {
  const nameSlug = slugify(playerName, {
    lower: true,
    strict: true,
    remove: /[*+~.()'"!:@]/g,
  });
  return `/players/${playerId}/${nameSlug}`;
};
