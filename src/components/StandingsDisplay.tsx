// src/components/StandingsDisplay.tsx
"use client";

import { useState, useContext } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import Slider from "react-slick";
import Image from "next/image";
import { ChevronRight, Info } from "lucide-react";

import { useLeagueContext } from "@/context/LeagueContext";
import { proxyImageUrl } from "@/lib/image-proxy";
import { generateTeamSlug } from "@/lib/generate-team-slug";
import StyledLink from "./StyledLink";

// --- SELF-CONTAINED TYPE DEFINITIONS ---
interface Team {
  id: number;
  name: string;
  logo: string;
}
interface TeamStats {
  played: number;
  win: number;
  draw: number;
  lose: number;
}
interface TeamStanding {
  rank: number;
  team: Team;
  points: number;
  goalsDiff: number;
  group: string;
  description: string | null;
  all: TeamStats;
}
interface League {
  id: number;
  name: string;
  logo: string;
  href: string;
}
interface StandingsResponse {
  league: League | null;
  standings: TeamStanding[][];
}

// --- CONFIGURATION & FETCHER (Unchanged) ---
const POPULAR_LEAGUES = [
  {
    id: 39,
    name: "Premier League",
    logo: "https://media.api-sports.io/football/leagues/39.png",
  },
  {
    id: 140,
    name: "La Liga",
    logo: "https://media.api-sports.io/football/leagues/140.png",
  },
  {
    id: 135,
    name: "Serie A",
    logo: "https://media.api-sports.io/football/leagues/135.png",
  },
  {
    id: 78,
    name: "Bundesliga",
    logo: "https://media.api-sports.io/football/leagues/78.png",
  },
  {
    id: 61,
    name: "Ligue 1",
    logo: "https://media.api-sports.io/football/leagues/61.png",
  },
];

const fetchStandings = async (
  leagueId: number,
  season: number
): Promise<StandingsResponse> => {
  const { data } = await axios.get(
    `/api/standings?league=${leagueId}&season=${season}`
  );
  return data;
};

// --- UI HELPERS (Unchanged) ---
const getRankIndicatorClass = (description: string | null): string => {
  if (!description) return "bg-gray-700 text-brand-light";
  const desc = description.toLowerCase();
  if (desc.includes("champions league") || desc.includes("promotion"))
    return "bg-green-500/20 text-green-400";
  if (desc.includes("europa league") || desc.includes("qualification"))
    return "bg-orange-500/20 text-orange-400";
  if (desc.includes("conference league") || desc.includes("play-off"))
    return "bg-sky-400/20 text-sky-300";
  if (desc.includes("relegation")) return "bg-red-600/20 text-red-500";
  return "bg-gray-700 text-brand-light";
};

// --- INTERNAL TABLE COMPONENT ---
const InternalStandingTable = ({
  group,
  league,
}: {
  group: TeamStanding[];
  league: League;
}) => {
  const validGroup = group.filter((item) => item && item.team);
  if (validGroup.length === 0) return null;

  return (
    // --- MODIFIED LINE: Added max-height, overflow, and custom scrollbar classes ---
    <div className="px-1 overflow-y-auto max-h-96 custom-scrollbar">
      <table className="w-full text-sm">
        <thead className="text-left text-brand-muted sticky top-0 bg-brand-secondary z-10">
          <tr className="text-xs">
            <th className="p-2 w-8 text-center">#</th>
            <th className="p-2">Team</th>
            <th className="p-2 text-center">P</th>
            <th className="p-2 text-center">GD</th>
            <th className="p-2 text-center font-bold">Pts</th>
          </tr>
        </thead>
        <tbody className="text-brand-light">
          {validGroup.map((item) => (
            <tr key={item.team.id} className="border-t border-gray-700/50">
              <td className="p-2 text-center">
                <span
                  className={`w-6 h-6 flex items-center justify-center text-xs font-bold rounded-md ${getRankIndicatorClass(
                    item.description
                  )}`}
                >
                  {item.rank}
                </span>
              </td>
              <td className="p-2">
                <StyledLink
                  href={generateTeamSlug(item.team.name, item.team.id)}
                  className="flex items-center gap-2 group"
                >
                  <Image
                    src={proxyImageUrl(item.team.logo)}
                    alt={item.team.name}
                    width={20}
                    height={20}
                  />
                  <span className="font-semibold group-hover:text-brand-purple transition-colors whitespace-nowrap">
                    {item.team.name}
                  </span>
                </StyledLink>
              </td>
              <td className="p-2 text-center">{item.all.played}</td>
              <td className="p-2 text-center">{item.goalsDiff}</td>
              <td className="p-2 text-center font-bold text-white">
                {item.points}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// --- LOADING SKELETON ---
const StandingsDisplaySkeleton = () => (
  // --- MODIFIED: Added a fixed height to the skeleton to prevent layout shift ---
  <div className="bg-brand-secondary rounded-lg h-[480px] animate-pulse">
    <div className="p-2 border-b border-gray-700/50 flex space-x-1">
      <div className="flex-1 h-10 bg-gray-700 rounded-md"></div>
      <div className="flex-1 h-10 bg-gray-700 rounded-md"></div>
      <div className="flex-1 h-10 bg-gray-700 rounded-md"></div>
      <div className="flex-1 h-10 bg-gray-700 rounded-md"></div>
      <div className="flex-1 h-10 bg-gray-700 rounded-md"></div>
    </div>
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <div className="h-5 w-2/5 bg-gray-700 rounded"></div>
        <div className="h-4 w-1/4 bg-gray-700 rounded"></div>
      </div>
      <div className="space-y-2">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 h-8">
            <div className="w-6 h-6 bg-gray-600 rounded"></div>
            <div className="w-5 h-5 bg-gray-600 rounded-full"></div>
            <div className="flex-1 h-4 bg-gray-600 rounded"></div>
            <div className="w-6 h-4 bg-gray-600 rounded"></div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// --- MAIN WIDGET COMPONENT (Unchanged logic) ---
export default function StandingsDisplay() {
  const { selectedLeague } = useLeagueContext();
  const [activePopularLeagueId, setActivePopularLeagueId] = useState(
    POPULAR_LEAGUES[0].id
  );
  const season = new Date().getFullYear();
  const leagueIdToFetch = selectedLeague?.id || activePopularLeagueId;

  const { data, isLoading, isError } = useQuery<StandingsResponse>({
    queryKey: ["standings", leagueIdToFetch, season],
    queryFn: () => fetchStandings(leagueIdToFetch, season),
    staleTime: 1000 * 60 * 15,
  });

  const sliderSettings = {
    dots: true,
    infinite: false,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: false,
    appendDots: (dots: any) => (
      <div>
        <ul className="m-0 pt-3"> {dots} </ul>
      </div>
    ),
  };

  const sanitizedStandingsGroups = data?.standings?.filter(
    (group) => group && group.length > 0
  );
  const hasStandings =
    sanitizedStandingsGroups && sanitizedStandingsGroups.length > 0;
  const showTabs = !selectedLeague || (selectedLeague && !hasStandings);

  if (isLoading) return <StandingsDisplaySkeleton />;

  return (
    <div className="bg-brand-secondary rounded-lg">
      {showTabs && (
        <div className="flex items-center p-2 space-x-1 border-b border-gray-700/50">
          {POPULAR_LEAGUES.map((popLeague) => (
            <button
              key={popLeague.id}
              onClick={() => setActivePopularLeagueId(popLeague.id)}
              className={`group flex-1 p-2 rounded-md transition-colors ${
                activePopularLeagueId === popLeague.id
                  ? "bg-brand-purple/20"
                  : "hover:bg-white/5"
              }`}
              title={popLeague.name}
            >
              <Image
                src={proxyImageUrl(popLeague.logo)}
                alt={popLeague.name}
                width={24}
                height={24}
                className="mx-auto transition-transform duration-300 ease-in-out group-hover:scale-110"
              />
            </button>
          ))}
        </div>
      )}

      <div className="p-4">
        {hasStandings && data?.league ? (
          <>
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-white font-bold">{data.league.name}</h3>
              <StyledLink
                href={data.league.href}
                className="text-xs text-brand-muted hover:text-white flex items-center gap-1"
              >
                View Full Table <ChevronRight size={14} />
              </StyledLink>
            </div>
            {sanitizedStandingsGroups.length === 1 ? (
              <InternalStandingTable
                group={sanitizedStandingsGroups[0]}
                league={data.league}
              />
            ) : (
              <Slider {...sliderSettings}>
                {sanitizedStandingsGroups.map((group) => (
                  <div key={group[0].group}>
                    <h4 className="text-center text-brand-light font-bold text-sm mb-2">
                      {group[0].group}
                    </h4>
                    <InternalStandingTable
                      group={group}
                      league={data.league!}
                    />
                  </div>
                ))}
              </Slider>
            )}
          </>
        ) : (
          <div className="text-center py-6">
            <Info size={32} className="mx-auto text-brand-muted mb-3" />
            <h4 className="font-bold text-white mb-1">
              {data?.league?.name || selectedLeague?.name || "No Standings"}
            </h4>
            <p className="text-sm text-brand-muted">
              Standings are not available for this competition.
              {showTabs && " Please select another league from the tabs above."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
