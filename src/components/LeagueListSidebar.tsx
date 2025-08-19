// ===== src/components/LeagueListSidebar.tsx =====

"use client";

import { useState, useMemo } from "react";
import Link from "@/components/StyledLink";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { League } from "@/types/api-football";
import { useTranslation } from "@/hooks/useTranslation";
import { proxyImageUrl } from "@/lib/image-proxy";
import { ChevronRight, ChevronDown } from "lucide-react";
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
      className={`w-full flex items-center justify-between p-2 rounded-lg transition-all duration-200 group ${
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
      <ChevronRight
        size={16}
        className="text-text-muted flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
      />
    </button>
  </li>
);

export default function LeagueListSidebar({
  allLeagues,
}: {
  allLeagues: League[];
}) {
  const { t } = useTranslation();
  const { selectedLeague, setSelectedLeague } = useLeagueContext();
  const [isExpanded, setIsExpanded] = useState(false);

  const displayedLeagues = useMemo(() => {
    if (!allLeagues) return [];
    return isExpanded ? allLeagues : allLeagues.slice(0, INITIAL_LEAGUE_COUNT);
  }, [allLeagues, isExpanded]);

  if (!allLeagues || allLeagues.length === 0) {
    return (
      <p className="text-text-muted text-xs p-2.5">
        {t("no_competitions_found")}
      </p>
    );
  }

  return (
    <>
      <ul className="space-y-1">
        {displayedLeagues.map((league) => (
          <LeagueItem
            key={league.id}
            league={league}
            isActive={selectedLeague?.id === league.id}
            onSelect={() => setSelectedLeague(league)}
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
