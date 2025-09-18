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
  // The only change is adding /football to the path
  return `/football/players/${playerId}/${nameSlug}`;
};
