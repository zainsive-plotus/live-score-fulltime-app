"use client";

import { useEffect, useMemo, useState, Dispatch, SetStateAction } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import Image from "next/image";
import { useLeagueContext } from "@/context/LeagueContext";
import { League } from "@/types/api-football";
import MatchListItem, { MatchListItemSkeleton } from "./MatchListItem";
import MatchDateNavigator from "./MatchDateNavigator";
import {
  Globe,
  ChevronsDown,
  Search,
  XCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { format } from "date-fns";
import { proxyImageUrl } from "@/lib/image-proxy";
import { useTranslation } from "@/hooks/useTranslation"; // <-- Import hook

function useDebounce(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
}

type StatusFilter = "all" | "live" | "finished" | "scheduled";
const INITIAL_MATCHES_TO_SHOW = 5;
const MATCHES_PER_PAGE = 10;
const LEAGUES_PER_PAGE = 8;

const fetchAllMatches = async (
  leagueId: number | null,
  date: Date
): Promise<any[]> => {
  const dateString = format(date, "yyyy-MM-dd");
  const url = leagueId
    ? `/api/fixtures?league=${leagueId}&date=${dateString}`
    : `/api/fixtures?date=${dateString}`;
  const { data } = await axios.get(url);
  return data;
};
const fetchGlobalLiveMatches = async (): Promise<any[]> => {
  const { data } = await axios.get("/api/global-live");
  return data;
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
  league: { name: string; logo: string; country: string; flag: string | null };
}) => (
  <div
    className="flex items-center gap-3 p-3 sticky top-0 z-10"
    style={{ backgroundColor: "var(--color-primary)" }}
  >
    <div className="w-[28px] h-[28px] flex items-center justify-center">
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
    <div>
      <p className="font-bold text-base text-white">{league.country}</p>
      <p className="text-sm text-text-muted">{league.name}</p>
    </div>
  </div>
);

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
        ? "bg-brand-purple text-white shadow-lg"
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
    {liveCount && liveCount > 0 && (
      <span className="ml-1 flex items-center justify-center text-[10px] font-bold text-white bg-brand-live rounded-full h-4 w-4">
        {liveCount}
      </span>
    )}
  </button>
);

export default function MatchList({
  setLiveLeagues,
}: {
  setLiveLeagues: Dispatch<SetStateAction<League[]>>;
}) {
  const { selectedLeague } = useLeagueContext();
  const [activeStatusFilter, setActiveStatusFilter] =
    useState<StatusFilter>("all");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [visibleMatchCounts, setVisibleMatchCounts] = useState<
    Record<string, number>
  >({});
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const { t } = useTranslation(); // <-- Use hook

  const STATUS_MAP: Record<StatusFilter, string[]> = {
    all: [],
    live: ["1H", "HT", "2H", "ET", "P", "LIVE"],
    finished: ["FT", "AET", "PEN"],
    scheduled: ["NS", "TBD", "PST"],
  };

  const [currentPage, setCurrentPage] = useState(1);

  const {
    data: allMatches,
    isLoading,
    error,
  } = useQuery({
    queryKey: [
      "allMatches",
      selectedLeague?.id || "global",
      format(selectedDate, "yyyy-MM-dd"),
    ],
    queryFn: () => fetchAllMatches(selectedLeague?.id || null, selectedDate),
    enabled: activeStatusFilter !== "live" && !debouncedSearchTerm,
  });

  const { data: liveMatchesData, isLoading: isLoadingLive } = useQuery({
    queryKey: ["globalLiveMatchesList"],
    queryFn: fetchGlobalLiveMatches,
    enabled: activeStatusFilter === "live" && !debouncedSearchTerm,
  });

  const { data: searchResults, isLoading: isLoadingSearch } = useQuery({
    queryKey: ["fixtureSearch", debouncedSearchTerm],
    queryFn: () => searchFixtures(debouncedSearchTerm),
    enabled: debouncedSearchTerm.length >= 3,
  });

  const { data: globalLiveCount } = useQuery({
    queryKey: ["globalLiveCount"],
    queryFn: fetchGlobalLiveMatches,
    select: (data) => data.length,
    refetchInterval: 30000,
    staleTime: 25000,
  });

  useEffect(() => {
    setVisibleMatchCounts({});
    setCurrentPage(1);
  }, [selectedDate, activeStatusFilter, debouncedSearchTerm]);

  const groupedMatches = useMemo(() => {
    const isSearching = debouncedSearchTerm.length >= 3;
    const matchesToProcess = isSearching
      ? searchResults
      : activeStatusFilter === "live"
      ? liveMatchesData
      : allMatches;

    if (!matchesToProcess) return [];

    const statusFilter = STATUS_MAP[activeStatusFilter];
    const matchesToGroup =
      !isSearching && statusFilter.length > 0
        ? matchesToProcess.filter((m) =>
            statusFilter.includes(m.fixture.status.short)
          )
        : matchesToProcess;

    matchesToGroup.sort(
      (a, b) =>
        new Date(a.fixture.date).getTime() - new Date(b.fixture.date).getTime()
    );

    return matchesToGroup.reduce((acc, match) => {
      const groupKey = isSearching
        ? format(new Date(match.fixture.date), "yyyy-MM-dd")
        : match.league.id;
      const leagueInfo = {
        ...match.league,
        name: isSearching
          ? format(new Date(match.fixture.date), "eeee, dd MMMM")
          : match.league.name,
      };
      if (!acc[groupKey]) acc[groupKey] = { leagueInfo, matches: [] };
      acc[groupKey].matches.push(match);
      return acc;
    }, {} as Record<string, { leagueInfo: any; matches: any[] }>);
  }, [
    allMatches,
    liveMatchesData,
    searchResults,
    activeStatusFilter,
    debouncedSearchTerm,
    STATUS_MAP,
  ]);

  const paginatedLeagueGroups = useMemo(() => {
    const leagueEntries = Object.entries(groupedMatches);
    const totalPages = Math.ceil(leagueEntries.length / LEAGUES_PER_PAGE);
    const startIndex = (currentPage - 1) * LEAGUES_PER_PAGE;
    const endIndex = startIndex + LEAGUES_PER_PAGE;
    return {
      paginatedEntries: leagueEntries.slice(startIndex, endIndex),
      totalPages,
      totalLeagues: leagueEntries.length,
    };
  }, [groupedMatches, currentPage]);

  const handleLoadMore = (leagueId: string | number) => {
    setVisibleMatchCounts((prevCounts) => ({
      ...prevCounts,
      [leagueId]:
        (prevCounts[leagueId] || INITIAL_MATCHES_TO_SHOW) + MATCHES_PER_PAGE,
    }));
  };

  const isCurrentlyLoading =
    (isLoading && !debouncedSearchTerm && activeStatusFilter !== "live") ||
    (isLoadingLive && !debouncedSearchTerm && activeStatusFilter === "live") ||
    (isLoadingSearch && debouncedSearchTerm.length >= 3);

  return (
    <div className="space-y-4">
      <div
        className="flex flex-col gap-3 p-2 rounded-xl"
        style={{ backgroundColor: "var(--color-primary)" }}
      >
        <h1 className="py-2 italic">{t("homepage_seo_text_title")}</h1>
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
        {!debouncedSearchTerm && (
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
                  liveCount={tab.key === "live" ? globalLiveCount : undefined}
                  hasLiveIndicator={
                    tab.key === "live" && (globalLiveCount ?? 0) > 0
                  }
                  onClick={() => setActiveStatusFilter(tab.key as StatusFilter)}
                />
              ))}
            </div>
          </>
        )}
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
        ) : paginatedLeagueGroups.paginatedEntries.length > 0 ? (
          <>
            {paginatedLeagueGroups.paginatedEntries.map(
              ([groupKey, { leagueInfo, matches }]: any) => {
                const visibleCount =
                  visibleMatchCounts[groupKey] || INITIAL_MATCHES_TO_SHOW;
                const remainingMatches = matches.length - visibleCount;
                const hasMore = remainingMatches > 0;
                return (
                  <div
                    key={groupKey}
                    style={{ backgroundColor: "var(--color-primary)" }}
                    className="rounded-lg overflow-hidden"
                  >
                    <LeagueGroupHeader league={leagueInfo} />
                    <div className="p-2 space-y-2">
                      {matches.slice(0, visibleCount).map((match: any) => (
                        <MatchListItem key={match.fixture.id} match={match} />
                      ))}
                      {hasMore && (
                        <button
                          onClick={() => handleLoadMore(groupKey)}
                          className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-text-muted p-3 rounded-lg transition-colors hover:text-white"
                          style={{ backgroundColor: "var(--color-secondary)" }}
                        >
                          <ChevronsDown size={16} />{" "}
                          {t("show_more_matches", {
                            count: Math.min(MATCHES_PER_PAGE, remainingMatches),
                          })}
                        </button>
                      )}
                    </div>
                  </div>
                );
              }
            )}
            {paginatedLeagueGroups.totalPages > 1 && (
              <div className="flex items-center justify-between p-2">
                <button
                  onClick={() => setCurrentPage((p) => p - 1)}
                  disabled={currentPage === 1}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand-secondary rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700/50 transition-colors"
                >
                  <ChevronLeft size={16} />
                  <span>{t("previous")}</span>
                </button>
                <span className="text-sm font-semibold text-brand-muted">
                  {t("page_of", {
                    currentPage,
                    totalPages: paginatedLeagueGroups.totalPages,
                  })}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => p + 1)}
                  disabled={currentPage === paginatedLeagueGroups.totalPages}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand-secondary rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700/50 transition-colors"
                >
                  <span>{t("next")}</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
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
              {debouncedSearchTerm
                ? t("no_search_results_subtitle", {
                    searchTerm: debouncedSearchTerm,
                  })
                : t("no_matches_for_date_subtitle")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
