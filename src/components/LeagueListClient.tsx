// ===== src/components/LeagueListClient.tsx =====

"use client";

import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { League } from "@/types/api-football";
import DirectoryCard, {
  DirectoryCardSkeleton,
} from "@/components/DirectoryCard";
import Pagination from "@/components/Pagination";
import { Search, SearchX } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { useDebounce } from "@/hooks/useDebounce";

const ITEMS_PER_PAGE = 15;

const fetchActiveLeagueIds = async (): Promise<number[]> => {
  const { data } = await axios.get("/api/active-leagues");
  return data;
};

interface PaginatedLeaguesResponse {
  leagues: League[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
  };
}

const fetchPaginatedLeagues = async (
  page: number,
  search: string,
  type: string
): Promise<PaginatedLeaguesResponse> => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: ITEMS_PER_PAGE.toString(),
    search: search,
    type: type,
    fetchAll: "true", // Ensure we trigger the paginated logic
  });
  const { data } = await axios.get(`/api/leagues?${params.toString()}`);
  return data;
};

export default function LeagueListClient() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<"all" | "league" | "cup">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const { t } = useTranslation();
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const { data: leaguesResponse, isLoading: isLoadingLeagues } = useQuery({
    queryKey: ["paginatedLeagues", currentPage, debouncedSearchTerm, filter],
    queryFn: () =>
      fetchPaginatedLeagues(currentPage, debouncedSearchTerm, filter),
    placeholderData: (previousData) => previousData,
    keepPreviousData: true,
  });

  const { data: activeLeagueIds } = useQuery({
    queryKey: ["activeLeagueIds"],
    queryFn: fetchActiveLeagueIds,
    staleTime: 1000 * 60 * 10,
  });

  // Reset page to 1 when search or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, filter]);

  // --- THIS IS THE FIX ---
  // A single, robust check for the loading state.
  const isLoading = isLoadingLeagues && !leaguesResponse;
  // --- END OF FIX ---

  return (
    <>
      <div className="bg-brand-secondary p-4 rounded-lg mb-8 flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-grow w-full">
          <Search
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted"
            size={20}
          />
          <input
            type="text"
            placeholder={t("search_leagues_placeholder")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[var(--color-primary)] border border-gray-700/50 rounded-lg p-3 pl-12 text-white focus:outline-none focus:ring-2 focus:ring-[var(--brand-accent)]"
          />
        </div>
        <div className="flex items-center gap-2 p-1 rounded-lg bg-[var(--color-primary)] w-full md:w-auto">
          <button
            onClick={() => setFilter("all")}
            className={`flex-1 md:flex-none px-4 py-1.5 rounded-md text-sm font-semibold transition-colors ${
              filter === "all"
                ? "bg-[var(--brand-accent)] text-white"
                : "text-text-muted hover:bg-gray-700/50"
            }`}
          >
            {t("filter_all")}
          </button>
          <button
            onClick={() => setFilter("league")}
            className={`flex-1 md:flex-none px-4 py-1.5 rounded-md text-sm font-semibold transition-colors ${
              filter === "league"
                ? "bg-[var(--brand-accent)] text-white"
                : "text-text-muted hover:bg-gray-700/50"
            }`}
          >
            {t("filter_leagues")}
          </button>
          <button
            onClick={() => setFilter("cup")}
            className={`flex-1 md:flex-none px-4 py-1.5 rounded-md text-sm font-semibold transition-colors ${
              filter === "cup"
                ? "bg-[var(--brand-accent)] text-white"
                : "text-text-muted hover:bg-gray-700/50"
            }`}
          >
            {t("filter_cups")}
          </button>
        </div>
      </div>

      <div>
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => (
              <DirectoryCardSkeleton key={i} />
            ))}
          </div>
        ) : leaguesResponse && leaguesResponse.leagues.length > 0 ? (
          <>
            <div className="mb-4">
              <h2 className="text-xl font-bold text-white">
                {t("showing_competitions", {
                  count: leaguesResponse.pagination.totalCount,
                })}
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {leaguesResponse.leagues.map((league) => (
                <DirectoryCard
                  key={league.id}
                  {...league}
                  isPopular={activeLeagueIds?.includes(league.id)}
                />
              ))}
            </div>
            {leaguesResponse.pagination.totalPages > 1 && (
              <Pagination
                currentPage={leaguesResponse.pagination.currentPage}
                totalPages={leaguesResponse.pagination.totalPages}
                onPageChange={setCurrentPage}
              />
            )}
          </>
        ) : (
          <div className="text-center py-20 bg-brand-secondary rounded-lg">
            <SearchX size={48} className="mx-auto text-text-muted mb-4" />
            <p className="text-xl font-bold text-white">
              {t("no_leagues_found_title")}
            </p>
            <p className="text-text-muted mt-2">
              {t("no_leagues_found_subtitle", {
                searchTerm: debouncedSearchTerm,
              })}
            </p>
          </div>
        )}
      </div>
    </>
  );
}
