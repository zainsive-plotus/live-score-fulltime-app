// src/components/LeagueListClient.tsx
"use client";

import { useState, useMemo, useEffect } from "react";
import { useQueries } from "@tanstack/react-query"; // Keep useQueries for live/active status polling
import axios from "axios";
import { League } from "@/types/api-football";
import DirectoryCard, {
  DirectoryCardSkeleton,
} from "@/components/DirectoryCard";
import Pagination from "@/components/Pagination";
import { Search } from "lucide-react"; // Import Search icon

const ITEMS_PER_PAGE = 15;

// Fetcher function for the IDs of currently active leagues (can still be client-side fetched)
const fetchActiveLeagueIds = async (): Promise<number[]> => {
  const { data } = await axios.get("/api/active-leagues");
  return data;
};

interface LeagueListClientProps {
  initialAllLeagues: League[]; // Server-fetched leagues passed as prop
}

export default function LeagueListClient({
  initialAllLeagues,
}: LeagueListClientProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<"all" | "league" | "cup">("all");
  const [currentPage, setCurrentPage] = useState(1);

  // useQueries to fetch active league IDs.
  // We don't fetch all leagues here again, we use `initialAllLeagues`.
  const { data: activeLeagueIds, isLoading: isLoadingActive } = useQueries({
    queries: [
      {
        queryKey: ["activeLeagueIds"],
        queryFn: fetchActiveLeagueIds,
        staleTime: 1000 * 60 * 10, // Re-check for active leagues every 10 minutes
      },
    ],
  })[0]; // Get the first (and only) query result

  const isLoading = isLoadingActive; // Only active status loading is client-side dynamic now

  // The main logic for filtering and sorting the leagues
  const { paginatedData, totalPages } = useMemo(() => {
    // Use the initialAllLeagues provided by the server
    const allLeagues = initialAllLeagues;
    const activeIdsSet = new Set(activeLeagueIds || []); // Ensure activeIdsSet is always a Set

    // First, apply the user's search and type filters
    const filtered = allLeagues.filter((league) => {
      const matchesSearch = league.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesFilter =
        filter === "all" || league.type.toLowerCase() === filter;
      return matchesSearch && matchesFilter;
    });

    // Separate the filtered list into active and inactive leagues
    const activeLeagues = filtered.filter((l) => activeIdsSet.has(l.id));
    const inactiveLeagues = filtered.filter((l) => !activeIdsSet.has(l.id));

    // Sort each sub-list alphabetically for consistent ordering
    activeLeagues.sort((a, b) => a.name.localeCompare(b.name));
    inactiveLeagues.sort((a, b) => a.name.localeCompare(b.name));

    // Combine the lists, with active leagues appearing first
    const sortedAndFiltered = [...activeLeagues, ...inactiveLeagues];

    // Apply pagination to the final, sorted list
    const totalPages = Math.ceil(sortedAndFiltered.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const paginatedData = sortedAndFiltered.slice(startIndex, endIndex);

    return { paginatedData, totalPages };
  }, [initialAllLeagues, activeLeagueIds, searchTerm, filter, currentPage]);

  // Reset to the first page whenever the filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filter]);

  return (
    <>
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-grow">
          <Search
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-muted"
            size={20}
          />
          <input
            type="text"
            placeholder="Search by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:w-1/3 p-3 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-purple pl-12"
          />
        </div>
        <div className="flex items-center gap-2 p-1 rounded-lg bg-brand-secondary">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-colors ${
              filter === "all"
                ? "bg-brand-purple text-white"
                : "text-brand-muted hover:bg-gray-700/50"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter("league")}
            className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-colors ${
              filter === "league"
                ? "bg-brand-purple text-white"
                : "text-brand-muted hover:bg-gray-700/50"
            }`}
          >
            Leagues
          </button>
          <button
            onClick={() => setFilter("cup")}
            className={`px-3 py-1.5 rounded-md text-sm font-semibold transition-colors ${
              filter === "cup"
                ? "bg-brand-purple text-white"
                : "text-brand-muted hover:bg-gray-700/50"
            }`}
          >
            Cups
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {isLoadingActive // Show skeleton only for active status loading
          ? Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => (
              <DirectoryCardSkeleton key={i} />
            ))
          : paginatedData.map((league) => (
              <DirectoryCard
                key={league.id}
                {...league}
                isPopular={activeLeagueIds?.includes(league.id)}
              />
            ))}
      </div>

      {!isLoadingActive && paginatedData.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}

      {!isLoadingActive && paginatedData.length === 0 && (
        <div className="text-center py-20 bg-brand-secondary rounded-lg">
          <p className="text-xl font-bold text-white">No Results Found</p>
          <p className="text-brand-muted mt-2">
            Try adjusting your search or filter.
          </p>
        </div>
      )}
    </>
  );
}
