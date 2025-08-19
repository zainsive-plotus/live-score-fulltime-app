// ===== src/components/SidebarLeagueList.tsx =====

import {
  topLeaguesConfig,
  leagueIdToPriorityMap,
} from "@/config/topLeaguesConfig";
import dbConnect from "@/lib/dbConnect";
import LeagueModel from "@/models/League";
import { League } from "@/types/api-football";
import { generateLeagueSlug } from "@/lib/generate-league-slug";
import LeagueListSidebar from "./LeagueListSidebar";

const LeagueItemSkeleton = () => (
  <div className="flex items-center justify-between p-2 rounded-lg animate-pulse">
    <div className="flex items-center gap-3 w-3/4">
      <div className="h-6 w-6 rounded-full bg-gray-600/50"></div>
      <div className="h-4 w-full rounded bg-gray-600/50"></div>
    </div>
  </div>
);

export const SidebarLeagueListSkeleton = () => {
  const INITIAL_LEAGUE_COUNT = 15;
  return (
    <div className="space-y-1">
      {Array.from({ length: INITIAL_LEAGUE_COUNT }).map((_, i) => (
        <LeagueItemSkeleton key={i} />
      ))}
    </div>
  );
};

const fetchLeagues = async (): Promise<League[]> => {
  try {
    await dbConnect();
    const leagueIds = topLeaguesConfig.map((l) => parseInt(l.leagueId, 10));

    const leaguesFromDB = await LeagueModel.find({
      leagueId: { $in: leagueIds },
    }).lean();

    const formattedLeagues: League[] = leaguesFromDB.map((league) => ({
      id: league.leagueId,
      name: league.name,
      logoUrl: league.logoUrl,
      countryName: league.countryName,
      countryFlagUrl: league.countryFlagUrl || "",
      type: league.type,
      href: generateLeagueSlug(league.name, league.leagueId),
    }));

    const sortedData = formattedLeagues.sort((a, b) => {
      const priorityA = leagueIdToPriorityMap.get(a.id.toString()) || 999;
      const priorityB = leagueIdToPriorityMap.get(b.id.toString()) || 999;
      return priorityA - priorityB;
    });

    return sortedData;
  } catch (error) {
    console.error(
      "[SidebarLeagueList] Failed to fetch leagues from DB:",
      error
    );
    return [];
  }
};

export default async function SidebarLeagueList() {
  const allLeagues = await fetchLeagues();

  // This server component fetches the data and passes the clean array
  // to the client component which handles state and interactions.
  return <LeagueListSidebar allLeagues={allLeagues} />;
}
