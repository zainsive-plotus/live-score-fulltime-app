// ===== src/lib/data/team-static.ts =====

import "server-only";
import fs from "fs/promises";
import path from "path";
import { cache } from "react";

interface TeamStaticData {
  [key: string]: {
    team: any;
    venue: any;
  };
}

// Cache the data in memory for the server's lifetime
let teamDataCache: TeamStaticData | null = null;

export const getTeamStaticData = cache(async (): Promise<TeamStaticData> => {
  if (teamDataCache) {
    return teamDataCache;
  }

  try {
    const filePath = path.join(process.cwd(), "public/data/teams-static.json");
    const fileContent = await fs.readFile(filePath, "utf-8");
    teamDataCache = JSON.parse(fileContent);
    return teamDataCache!;
  } catch (error) {
    console.error(
      "Error reading static team data file. Returning empty object.",
      error
    );
    // In dev, the file might not exist yet. In prod, this would be an error.
    return {};
  }
});
