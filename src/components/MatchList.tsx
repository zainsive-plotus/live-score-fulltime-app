// ===== src/components/MatchList.tsx =====

"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { format } from "date-fns";
import { Info, Search, XCircle, ChevronDown } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { useDebounce } from "@/hooks/useDebounce";
import MatchListItem, { MatchListItemSkeleton } from "./MatchListItem";
import MatchDateNavigator from "./MatchDateNavigator";
import StyledLink from "./StyledLink";
import { generateLeagueSlug } from "@/lib/generate-league-slug";
import { leagueIdToPriorityMap } from "@/config/topLeaguesConfig";
import Image from "next/image";
import { proxyImageUrl } from "@/lib/image-proxy";
import { Globe } from "lucide-react";

type StatusFilter = "all" | "live" | "finished" | "scheduled";

const fetchAllFixturesByGroup = async (date: Date, status: StatusFilter) => {
  if (status === "live") {
    const { data: liveMatches } = await axios.get("/api/global-live");
    if (!liveMatches || liveMatches.length === 0) {
      return { leagueGroups: [] };
    }

    const groupedMatches = liveMatches.reduce((acc: any, match: any) => {
      const groupKey = match.league.id;
      if (!acc[groupKey]) {
        acc[groupKey] = {
          leagueInfo: { ...match.league },
          matches: [],
        };
      }
      acc[groupKey].matches.push(match);
      return acc;
    }, {});

    const leagueGroups = Object.values(groupedMatches);

    leagueGroups.sort((a: any, b: any) => {
      const priorityA =
        leagueIdToPriorityMap.get(a.leagueInfo.id.toString()) || 999;
      const priorityB =
        leagueIdToPriorityMap.get(b.leagueInfo.id.toString()) || 999;
      if (priorityA !== priorityB) return priorityA - priorityB;
      return a.leagueInfo.name.localeCompare(b.leagueInfo.name);
    });

    return { leagueGroups };
  } else {
    const dateString = format(date, "yyyy-MM-dd");
    const params = new URLSearchParams({
      date: dateString,
      status,
      groupByLeague: "true",
    });
    const { data } = await axios.get(`/api/fixtures?${params.toString()}`);
    return data;
  }
};

const searchFixtures = async (query: string): Promise<any[]> => {
  if (query.length < 3) return [];
  const { data } = await axios.get(
    `/api/search/fixtures?q=${encodeURIComponent(query)}`
  );
  return data;
};

const LeagueGroupHeader = ({
  league,
}: {
  league: {
    id: number;
    name: string;
    logo: string;
    country: string;
    flag: string | null;
  };
}) => {
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
  liveCount,
  onClick,
  hasLiveIndicator,
}: {
  label: string;
  isActive: boolean;
  liveCount?: number;
  onClick: () => void;
  hasLiveIndicator?: boolean;
}) => (
  <button
    onClick={onClick}
    className={`relative flex-1 md:flex-none flex items-center justify-center gap-2 px-3 md:px-4 py-2.5 rounded-lg text-xs md:text-sm font-bold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-purple/50 ${
      isActive
        ? "bg-[var(--color-primary)] text-white shadow-lg"
        : "bg-transparent text-text-muted hover:text-white"
    }`}
  >
    {hasLiveIndicator && (
      <span className="relative flex h-3 w-3">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-3 w-3 bg-brand-live"></span>
      </span>
    )}
    {label}
    {hasLiveIndicator ? (
      <span className="ml-1 flex items-center justify-center text-[10px] font-bold text-white bg-brand-live rounded-full h-4 w-4">
        {liveCount}
      </span>
    ) : (
      <></>
    )}
  </button>
);

// MODIFIED: This component no longer accepts any props.
export default function MatchList() {
  const [activeStatusFilter, setActiveStatusFilter] =
    useState<StatusFilter>("live");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const { t } = useTranslation();
  const [expandedLeagues, setExpandedLeagues] = useState<Set<number>>(
    new Set()
  );

  const { data: searchResults, isLoading: isLoadingSearch } = useQuery({
    queryKey: ["fixtureSearch", debouncedSearchTerm],
    queryFn: () => searchFixtures(debouncedSearchTerm),
    enabled: debouncedSearchTerm.length >= 3,
  });

  const { data: fixtureData, isLoading: isLoadingFixtures } = useQuery({
    queryKey: [
      "allFixturesByGroup",
      format(selectedDate, "yyyy-MM-dd"),
      activeStatusFilter,
    ],
    queryFn: () => fetchAllFixturesByGroup(selectedDate, activeStatusFilter),
    enabled: !debouncedSearchTerm,
    refetchInterval: activeStatusFilter === "live" ? 30000 : false,
    staleTime: 25000,
  });

  const { data: liveMatchCount } = useQuery({
    queryKey: ["globalLiveCount"],
    queryFn: () => axios.get("/api/global-live").then((res) => res.data.length),
    refetchInterval: 30000,
    staleTime: 25000,
  });

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

  const isCurrentlyLoading =
    isLoadingFixtures || (isLoadingSearch && debouncedSearchTerm.length >= 3);

  return (
    <div className="space-y-4">
      <div
        className="flex flex-col gap-3 p-2 rounded-xl"
        style={{ backgroundColor: "var(--color-primary)" }}
      >
        <h1 className="py-2 italic text-sm text-text-muted px-2">
          {t("homepage_seo_text_title")}
        </h1>
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
            size={20}
          />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t("search_fixtures_placeholder")}
            className="w-full bg-[var(--color-secondary)] border border-gray-700/50 rounded-lg p-3 pl-11 text-white placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-[var(--brand-accent)]"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-white"
            >
              <XCircle size={18} />
            </button>
          )}
        </div>
        <>
          <div className="flex justify-center">
            <MatchDateNavigator
              selectedDate={selectedDate}
              onDateChange={setSelectedDate}
            />
          </div>
          <div
            className="flex items-center gap-1 p-1 rounded-xl w-full"
            style={{ backgroundColor: "var(--color-secondary)" }}
          >
            {[
              { key: "all", label: t("filter_all") },
              { key: "live", label: t("filter_live") },
              { key: "finished", label: t("filter_finished") },
              { key: "scheduled", label: t("filter_scheduled") },
            ].map((tab) => (
              <TabButton
                key={tab.key}
                label={tab.label}
                isActive={activeStatusFilter === tab.key}
                liveCount={liveMatchCount}
                hasLiveIndicator={tab.key === "live" && liveMatchCount > 0}
                onClick={() => setActiveStatusFilter(tab.key as StatusFilter)}
              />
            ))}
          </div>
        </>
      </div>
      <div className="space-y-4">
        {isCurrentlyLoading ? (
          <div
            style={{ backgroundColor: "var(--color-primary)" }}
            className="rounded-lg p-2 space-y-2"
          >
            {Array.from({ length: 10 }).map((_, i) => (
              <MatchListItemSkeleton key={i} />
            ))}
          </div>
        ) : fixtureData?.leagueGroups?.length > 0 ? (
          <>
            {fixtureData.leagueGroups.map(({ leagueInfo, matches }: any) => {
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
