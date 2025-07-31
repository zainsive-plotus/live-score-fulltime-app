// ===== src/components/MatchList.tsx =====

"use client";

import { useEffect, useState, Dispatch, SetStateAction } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import Image from "next/image";
import { League } from "@/types/api-football";
import MatchListItem, { MatchListItemSkeleton } from "./MatchListItem";
import MatchDateNavigator from "./MatchDateNavigator";
import { Globe, Search, XCircle } from "lucide-react";
import { format } from "date-fns";
import { proxyImageUrl } from "@/lib/image-proxy";
import { useTranslation } from "@/hooks/useTranslation";
import Pagination from "./Pagination"; // We will use this for league pagination

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

// --- Start of New Data Fetching Logic ---
const fetchPaginatedFixtures = async (
  date: Date,
  status: StatusFilter,
  page: number,
  limit: number
) => {
  const dateString = format(date, "yyyy-MM-dd");
  const params = new URLSearchParams({
    date: dateString,
    status,
    page: page.toString(),
    limit: limit.toString(),
    groupByLeague: "true",
  });
  const { data } = await axios.get(`/api/fixtures?${params.toString()}`);
  return data;
};
// --- End of New Data Fetching Logic ---

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
  const [activeStatusFilter, setActiveStatusFilter] =
    useState<StatusFilter>("all");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const { t } = useTranslation();
  const [currentPage, setCurrentPage] = useState(1);
  const LEAGUES_PER_PAGE = 5;

  const { data: searchResults, isLoading: isLoadingSearch } = useQuery({
    queryKey: ["fixtureSearch", debouncedSearchTerm],
    queryFn: () => searchFixtures(debouncedSearchTerm),
    enabled: debouncedSearchTerm.length >= 3,
  });

  const { data: paginatedData, isLoading: isLoadingFixtures } = useQuery({
    queryKey: [
      "paginatedFixtures",
      format(selectedDate, "yyyy-MM-dd"),
      activeStatusFilter,
      currentPage,
    ],
    queryFn: () =>
      fetchPaginatedFixtures(
        selectedDate,
        activeStatusFilter,
        currentPage,
        LEAGUES_PER_PAGE
      ),
    enabled: !debouncedSearchTerm,
    keepPreviousData: true,
  });

  const { data: globalLiveCount } = useQuery({
    queryKey: ["globalLiveCount"],
    queryFn: () => axios.get("/api/global-live").then((res) => res.data.length),
    refetchInterval: 30000,
    staleTime: 25000,
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedDate, activeStatusFilter, debouncedSearchTerm]);

  const isCurrentlyLoading =
    isLoadingFixtures || (isLoadingSearch && debouncedSearchTerm.length >= 3);

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
        {isCurrentlyLoading && !paginatedData ? (
          <div
            style={{ backgroundColor: "var(--color-primary)" }}
            className="rounded-lg p-2 space-y-2"
          >
            {Array.from({ length: 10 }).map((_, i) => (
              <MatchListItemSkeleton key={i} />
            ))}
          </div>
        ) : paginatedData?.paginatedLeagueGroups?.length > 0 ? (
          <>
            {paginatedData.paginatedLeagueGroups.map(
              ({ leagueInfo, matches }: any) => (
                <div
                  key={leagueInfo.id}
                  style={{ backgroundColor: "var(--color-primary)" }}
                  className="rounded-lg overflow-hidden"
                >
                  <LeagueGroupHeader league={leagueInfo} />
                  <div className="p-2 space-y-2">
                    {matches.map((match: any) => (
                      <MatchListItem key={match.fixture.id} match={match} />
                    ))}
                  </div>
                </div>
              )
            )}
            {paginatedData?.pagination.totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={paginatedData?.pagination.totalPages}
                onPageChange={setCurrentPage}
              />
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
