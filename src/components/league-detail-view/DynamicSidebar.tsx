// ===== src/components/league-detail-view/DynamicSidebar.tsx =====

"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import LeagueStandingsWidget from "./LeagueStandingsWidget";
import LeagueTopScorersWidget from "./LeagueTopScorersWidget";
import { generateStandingsSlug } from "@/lib/generate-standings-slug";

const fetchStandingsForSidebar = async (leagueId: number, season: number) => {
  const { data } = await axios.get(
    `/api/standings?league=${leagueId}&season=${season}`
  );
  return data;
};

const Skeleton = () => (
  <div className="space-y-8 animate-pulse">
    <div className="bg-brand-secondary rounded-lg h-96"></div>
    <div className="bg-brand-secondary rounded-lg h-64"></div>
  </div>
);

interface DynamicSidebarProps {
  leagueId: number;
  leagueName: string;
  selectedSeason: number;
}

export default function DynamicSidebar({
  leagueId,
  selectedSeason,
}: DynamicSidebarProps) {
  return (
    <>
      <LeagueTopScorersWidget leagueId={leagueId} season={selectedSeason} />
    </>
  );
}
