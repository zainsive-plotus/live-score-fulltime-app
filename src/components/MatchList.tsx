// ===== src/components/MatchList.tsx =====

"use client";

import { useMemo, useState } from "react";
import { Info, ChevronDown } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import MatchListItem, { MatchListItemSkeleton } from "./MatchListItem";
import MatchDateRangeNavigator from "./MatchDateRangeNavigator"; // <-- IMPORT NEW COMPONENT
import StyledLink from "./StyledLink";
import { generateLeagueSlug } from "@/lib/generate-league-slug";
import Image from "next/image";
import { proxyImageUrl } from "@/lib/image-proxy";
import { Globe } from "lucide-react";
import { DateRange } from "react-day-picker";

type StatusFilter = "all" | "live" | "finished" | "scheduled";

// --- CORE CHANGE: Updated props to accept a date range ---
interface MatchListProps {
  leagueGroups: any[];
  isLoading: boolean;
  dateRange: DateRange | undefined;
  onDateRangeChange: (range: DateRange | undefined) => void;
}

const STATUS_MAP: Record<string, string[]> = {
  all: [],
  live: ["1H", "HT", "2H", "ET", "P", "LIVE"],
  finished: ["FT", "AET", "PEN"],
  scheduled: ["NS", "TBD", "PST"],
};

const LeagueGroupHeader = ({ league }: { league: any }) => {
  const leagueHref = generateLeagueSlug(league.name, league.id);
  return (
    <div
      className="flex items-center gap-3 p-3 sticky top-0 z-10"
      style={{ backgroundColor: "var(--color-primary)" }}
    >
      <div className="w-[28px] h-[28px] flex items-center justify-center flex-shrink-0">
        {league.country === "World" ? (
          <Globe size={24} className="text-text-muted" />
        ) : (
          league.flag && (
            <Image
              src={proxyImageUrl(league.flag)}
              alt={league.country}
              width={28}
              height={28}
              className="rounded-full object-contain"
            />
          )
        )}
      </div>
      <div className="min-w-0">
        <p className="font-bold text-sm text-white truncate">
          {league.country}
        </p>
        <StyledLink href={leagueHref} className="group">
          <p className="text-sm text-[var(--brand-accent)] font-bold truncate group-hover:underline">
            {league.name}
          </p>
        </StyledLink>
      </div>
    </div>
  );
};

const TabButton = ({
  label,
  isActive,
  onClick,
}: {
  label: string;
  isActive: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={`relative flex-1 md:flex-none flex items-center justify-center gap-2 px-3 md:px-4 py-2.5 rounded-lg text-xs md:text-sm font-bold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-purple/50 ${
      isActive
        ? "bg-[var(--color-primary)] text-white shadow-lg"
        : "bg-transparent text-text-muted hover:text-white"
    }`}
  >
    {label}
  </button>
);

export default function MatchList({
  leagueGroups,
  isLoading,
  dateRange,
  onDateRangeChange,
}: MatchListProps) {
  const { t } = useTranslation();
  const [activeStatusFilter, setActiveStatusFilter] =
    useState<StatusFilter>("all");
  const [expandedLeagues, setExpandedLeagues] = useState<Set<number>>(
    new Set()
  );

  const filteredByStatusGroups = useMemo(() => {
    if (!leagueGroups) return [];
    if (activeStatusFilter === "all") return leagueGroups;

    const statusFilterSet = new Set(STATUS_MAP[activeStatusFilter]);

    return leagueGroups
      .map((group) => ({
        ...group,
        matches: group.matches.filter((match: any) =>
          statusFilterSet.has(match.fixture.status.short)
        ),
      }))
      .filter((group) => group.matches.length > 0);
  }, [leagueGroups, activeStatusFilter]);

  const toggleLeagueExpansion = (leagueId: number) => {
    setExpandedLeagues((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(leagueId)) {
        newSet.delete(leagueId);
      } else {
        newSet.add(leagueId);
      }
      return newSet;
    });
  };

  return (
    <div className="space-y-4">
      <div
        className="flex flex-col gap-3 p-2 rounded-xl"
        style={{ backgroundColor: "var(--color-primary)" }}
      >
        <h1 className="py-2 italic text-sm text-text-muted px-2">
          {t("homepage_seo_text_title")}
        </h1>

        {/* --- CORE CHANGE: Use the new date range navigator --- */}
        <MatchDateRangeNavigator
          range={dateRange}
          onRangeChange={onDateRangeChange}
        />

        <div
          className="flex items-center gap-1 p-1 rounded-xl w-full"
          style={{ backgroundColor: "var(--color-secondary)" }}
        >
          {["all", "live", "finished", "scheduled"].map((status) => (
            <TabButton
              key={status}
              label={t(`filter_${status}`)}
              isActive={activeStatusFilter === status}
              onClick={() => setActiveStatusFilter(status as StatusFilter)}
            />
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <div
            style={{ backgroundColor: "var(--color-primary)" }}
            className="rounded-lg p-2 space-y-2"
          >
            {Array.from({ length: 10 }).map((_, i) => (
              <MatchListItemSkeleton key={i} />
            ))}
          </div>
        ) : filteredByStatusGroups && filteredByStatusGroups.length > 0 ? (
          <>
            {filteredByStatusGroups.map(({ leagueInfo, matches }: any) => {
              const isExpanded = expandedLeagues.has(leagueInfo.id);
              const displayedMatches = isExpanded
                ? matches
                : matches.slice(0, 3);
              return (
                <div
                  key={leagueInfo.id}
                  style={{ backgroundColor: "var(--color-primary)" }}
                  className="rounded-lg overflow-hidden"
                >
                  <LeagueGroupHeader league={leagueInfo} />
                  <div className="p-2 space-y-2">
                    {displayedMatches.map((match: any) => (
                      <MatchListItem key={match.fixture.id} match={match} />
                    ))}
                  </div>
                  {matches.length > 3 && (
                    <div className="p-2 pt-0 text-center">
                      <button
                        onClick={() => toggleLeagueExpansion(leagueInfo.id)}
                        className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-text-muted hover:text-white hover:bg-gray-700/50 transition-colors py-2 rounded-md"
                      >
                        <span>
                          {isExpanded
                            ? t("show_less")
                            : t("show_more_matches", {
                                count: matches.length - 3,
                              })}
                        </span>
                        <ChevronDown
                          size={16}
                          className={`transition-transform duration-200 ${
                            isExpanded ? "rotate-180" : ""
                          }`}
                        />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </>
        ) : (
          <div
            className="text-center py-20 rounded-lg"
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            <p className="text-white font-semibold capitalize">
              {t("no_matches_found_title")}
            </p>
            <p className="text-sm text-text-muted mt-1">
              {t("no_matches_for_date_subtitle")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
