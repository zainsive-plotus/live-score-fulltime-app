"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import TeamCard, { TeamCardSkeleton } from "./TeamCard";
import { Info, Search } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation"; // <-- Import hook

interface LeagueTeamsListProps {
  leagueId: number;
  season: number;
  countryName: string;
  countryFlag: string;
}

interface CombinedTeamData {
  team: any;
  venue: any;
  rank?: number;
  description?: string;
  squadSize?: number;
}

const fetchLeagueData = async (leagueId: number, season: number) => {
  const [teamsResponse, standingsResponse] = await Promise.all([
    axios.get(`/api/teams?league=${leagueId}&season=${season}`),
    axios.get(`/api/standings?league=${leagueId}&season=${season}`),
  ]);

  const teamsData = teamsResponse.data;
  const standingsData = standingsResponse.data.standings?.[0] || [];
  const standingsMap = new Map(standingsData.map((s: any) => [s.team.id, s]));

  const combinedData: CombinedTeamData[] = teamsData.map((teamData: any) => {
    const standing: any = standingsMap.get(teamData.team.id);
    return {
      ...teamData,
      rank: standing?.rank,
      description: standing?.description,
    };
  });

  combinedData.sort((a, b) => {
    if (a.rank == null) return 1;
    if (b.rank == null) return -1;
    return a.rank - b.rank;
  });

  return combinedData;
};

export default function LeagueTeamsList({
  leagueId,
  season,
  countryName,
  countryFlag,
}: LeagueTeamsListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const { t } = useTranslation(); // <-- Use hook

  const {
    data: combinedData,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["leagueCombinedData", leagueId, season],
    queryFn: () => fetchLeagueData(leagueId, season),
    staleTime: 1000 * 60 * 60,
  });

  const filteredTeams = useMemo(() => {
    if (!combinedData) return [];

    return combinedData.filter((teamData: CombinedTeamData) =>
      teamData.team.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [combinedData, searchTerm]);

  const responsiveGridClasses =
    "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4";

  if (isError) {
    return (
      <div className="bg-brand-secondary p-8 rounded-lg text-center">
        <Info size={32} className="mx-auto text-brand-muted mb-3" />
        <p className="text-brand-light font-semibold">
          {t("error_loading_teams")}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="relative">
        <Search
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-muted"
          size={20}
        />
        <input
          type="text"
          placeholder={t("search_for_team_placeholder")}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-brand-secondary border border-gray-700/50 rounded-lg p-3 pl-12 text-white focus:outline-none focus:ring-2 focus:ring-brand-purple"
        />
      </div>

      {isLoading ? (
        <div className={responsiveGridClasses}>
          {Array.from({ length: 12 }).map((_, i) => (
            <TeamCardSkeleton key={i} />
          ))}
        </div>
      ) : filteredTeams.length > 0 ? (
        <div className={responsiveGridClasses}>
          {filteredTeams.map((data: CombinedTeamData) => (
            <TeamCard
              key={data.team.id}
              team={data.team}
              venue={data.venue}
              rank={data.rank}
              countryName={countryName}
              countryFlag={countryFlag}
              rankDescription={data.description}
            />
          ))}
        </div>
      ) : (
        <div className="bg-brand-secondary p-8 rounded-lg text-center">
          <Info size={32} className="mx-auto text-brand-muted mb-3" />
          <p className="text-brand-light font-semibold">
            {t("no_teams_found_for_search", { searchTerm })}
          </p>
        </div>
      )}
    </div>
  );
}
