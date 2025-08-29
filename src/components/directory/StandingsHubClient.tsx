"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { League } from "@/types/api-football";
import FeaturedLeagueCard, {
  FeaturedLeagueCardSkeleton,
} from "./FeaturedLeagueCard";
import Pagination from "@/components/Pagination";
import { Search, SearchX } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { useDebounce } from "@/hooks/useDebounce";

const ITEMS_PER_PAGE = 18;

interface PaginatedLeaguesResponse {
  leagues: League[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
  };
}

// ** NEW: Fetcher for paginated and searched data **
const fetchStandingsLeagues = async (
  page: number,
  search: string
): Promise<PaginatedLeaguesResponse> => {
  // Note: The backend API for standings doesn't support search yet.
  // This is set up for future expansion. For now, search is client-side.
  const params = new URLSearchParams({
    page: page.toString(),
    limit: ITEMS_PER_PAGE.toString(),
  });
  const { data } = await axios.get(
    `/api/directory/standings-leagues?${params.toString()}`
  );
  return data;
};

export default function StandingsHubClient({
  initialLeagues,
  initialPagination,
}: {
  initialLeagues: League[];
  initialPagination: any;
}) {
  const { t } = useTranslation();
  const [currentPage, setCurrentPage] = useState(initialPagination.currentPage);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const { data: leaguesResponse, isLoading } = useQuery({
    queryKey: ["paginatedStandingsLeagues", currentPage],
    queryFn: () => fetchStandingsLeagues(currentPage, debouncedSearchTerm),
    placeholderData: (previousData) => previousData,
    initialData: { leagues: initialLeagues, pagination: initialPagination },
    keepPreviousData: true,
  });

  const filteredLeagues = useMemo(() => {
    if (!leaguesResponse?.leagues) return [];
    if (debouncedSearchTerm.length < 3) return leaguesResponse.leagues;
    return leaguesResponse.leagues.filter(
      (league) =>
        league.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        league.countryName
          .toLowerCase()
          .includes(debouncedSearchTerm.toLowerCase())
    );
  }, [leaguesResponse, debouncedSearchTerm]);

  return (
    <div className="space-y-8">
      <section>
        <div className="bg-brand-secondary p-4 rounded-lg mb-8">
          <div className="relative w-full">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted"
              size={20}
            />
            <input
              type="text"
              placeholder={t("search_leagues_placeholder")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[var(--color-primary)] border border-gray-700/50 rounded-lg p-3 pl-12 text-white placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-[var(--brand-accent)]"
            />
          </div>
        </div>

        {isLoading && !leaguesResponse ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => (
              <FeaturedLeagueCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredLeagues.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredLeagues.map((league) => (
                <FeaturedLeagueCard key={league.id} {...league} />
              ))}
            </div>
            {leaguesResponse?.pagination &&
              leaguesResponse.pagination.totalPages > 1 &&
              !debouncedSearchTerm && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={leaguesResponse.pagination.totalPages}
                  onPageChange={setCurrentPage}
                />
              )}
          </>
        ) : (
          <div className="text-center py-16 bg-brand-secondary rounded-lg">
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
      </section>
    </div>
  );
}
