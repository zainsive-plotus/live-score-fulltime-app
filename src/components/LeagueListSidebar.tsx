// ===== src/components/LeagueListSidebar.tsx =====

"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { League } from "@/types/api-football";
import { useTranslation } from "@/hooks/useTranslation";
import { proxyImageUrl } from "@/lib/image-proxy";
import { ChevronDown, Layers } from "lucide-react";
import { useLeagueContext } from "@/context/LeagueContext";

const INITIAL_LEAGUE_COUNT = 15;

const LeagueItem = ({
  league,
  isActive,
  onSelect,
}: {
  league: League;
  isActive: boolean;
  onSelect: () => void;
}) => (
  <li>
    <button
      onClick={onSelect}
      className={`w-full flex items-center p-2.5 rounded-lg transition-all duration-200 group ${
        isActive
          ? "bg-[var(--brand-accent)] shadow-md text-white"
          : "hover:bg-gray-700/50 text-text-primary"
      }`}
    >
      <div className="flex items-center gap-3 overflow-hidden">
        <Image
          src={proxyImageUrl(league.logoUrl)}
          alt={`${league.name} logo`}
          width={24}
          height={24}
          className="flex-shrink-0"
          unoptimized={true}
        />
        <span
          className={`font-bold text-sm truncate ${
            isActive ? "text-white" : "text-text-primary"
          }`}
        >
          {league.name}
        </span>
      </div>
    </button>
  </li>
);

export default function LeagueListSidebar({
  allLeagues,
}: {
  allLeagues: League[];
}) {
  const { t } = useTranslation();
  // --- CORE CHANGE: Use the new context state ---
  const { selectedLeagueIds, setSelectedLeagueIds } = useLeagueContext();
  const [isExpanded, setIsExpanded] = useState(false);

  const displayedLeagues = useMemo(() => {
    if (!allLeagues) return [];
    return isExpanded ? allLeagues : allLeagues.slice(0, INITIAL_LEAGUE_COUNT);
  }, [allLeagues, isExpanded]);

  // --- CORE CHANGE: Handle multi-select logic ---
  const handleSelectLeague = (leagueId: number) => {
    setSelectedLeagueIds((prevIds) => {
      const newIds = new Set(prevIds);
      if (newIds.has(leagueId)) {
        newIds.delete(leagueId); // Unselect if already selected
      } else {
        newIds.add(leagueId); // Select if not selected
      }
      return Array.from(newIds);
    });
  };

  const handleSelectAll = () => {
    setSelectedLeagueIds([]); // Clear the array to show all
  };

  if (!allLeagues || allLeagues.length === 0) {
    return (
      <p className="text-text-muted text-xs p-2.5">
        {t("no_competitions_found")}
      </p>
    );
  }

  const isAllActive = selectedLeagueIds.length === 0;

  return (
    <>
      <ul className="space-y-1">
        {/* --- NEW: All Leagues Button --- */}
        <li>
          <button
            onClick={handleSelectAll}
            className={`w-full flex items-center p-2.5 rounded-lg transition-all duration-200 group ${
              isAllActive
                ? "bg-[var(--brand-accent)] shadow-md text-white"
                : "hover:bg-gray-700/50 text-text-primary"
            }`}
          >
            <div className="flex items-center gap-3 overflow-hidden">
              {/* <Layers size={24} className="flex-shrink-0 p-0.5" /> */}
              <span className="font-bold text-sm truncate">
                {t("all_leagues")}
              </span>
            </div>
          </button>
        </li>

        {/* --- List of individual leagues --- */}
        {displayedLeagues.map((league) => (
          <LeagueItem
            key={league.id}
            league={league}
            isActive={selectedLeagueIds.includes(league.id)}
            onSelect={() => handleSelectLeague(league.id)}
          />
        ))}
      </ul>
      {allLeagues.length > INITIAL_LEAGUE_COUNT && (
        <div className="mt-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full flex items-center justify-center gap-2 py-2 text-xs font-semibold text-text-muted hover:text-white hover:bg-gray-700/50 rounded-md transition-colors"
          >
            <span>{isExpanded ? t("show_less") : t("show_more")}</span>
            <ChevronDown
              size={14}
              className={`transition-transform duration-200 ${
                isExpanded ? "rotate-180" : ""
              }`}
            />
          </button>
        </div>
      )}
    </>
  );
}
