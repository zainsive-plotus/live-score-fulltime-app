// src/app/football/leagues/page.tsx
"use client";

import { useState, useMemo, useEffect } from "react";
import { useQueries } from "@tanstack/react-query";
import axios from "axios";
import { League } from "@/types/api-football";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import DirectoryCard, {
  DirectoryCardSkeleton,
} from "@/components/DirectoryCard";
import Pagination from "@/components/Pagination";

export const dynamic = "force-dynamic";

const ITEMS_PER_PAGE = 15;

// Fetcher function for all leagues
const fetchAllLeagues = async (): Promise<League[]> => {
  const { data } = await axios.get("/api/leagues?fetchAll=true");
  return data;
};

// Fetcher function for the IDs of currently active leagues
const fetchActiveLeagueIds = async (): Promise<number[]> => {
  const { data } = await axios.get("/api/active-leagues");
  return data;
};

export default function LeaguesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<"all" | "league" | "cup">("all");
  const [currentPage, setCurrentPage] = useState(1);

  // useQueries fetches both datasets in parallel for optimal performance
  const [
    { data: allLeagues, isLoading: isLoadingLeagues },
    { data: activeLeagueIds, isLoading: isLoadingActive },
  ] = useQueries({
    queries: [
      {
        queryKey: ["allLeaguesDirectory"],
        queryFn: fetchAllLeagues,
        staleTime: 1000 * 60 * 60, // Cache all leagues for 1 hour
      },
      {
        queryKey: ["activeLeagueIds"],
        queryFn: fetchActiveLeagueIds,
        staleTime: 1000 * 60 * 10, // Re-check for active leagues every 10 minutes
      },
    ],
  });

  const isLoading = isLoadingLeagues || isLoadingActive;

  // The main logic for filtering and sorting the leagues
  const { paginatedData, totalPages } = useMemo(() => {
    // Wait until both API calls are complete before processing data
    if (!allLeagues || !activeLeagueIds) {
      return { paginatedData: [], totalPages: 0 };
    }

    const activeIdsSet = new Set(activeLeagueIds);

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
  }, [allLeagues, activeLeagueIds, searchTerm, filter, currentPage]);

  // Reset to the first page whenever the filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filter]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="container mx-auto flex-1 w-full lg:grid lg:grid-cols-[288px_1fr] lg:gap-8 lg:items-start">
        <Sidebar />
        <main className="min-w-0 p-4 lg:p-0 lg:py-6">
          <h1 className="text-4xl font-extrabold text-white mb-6">
            Leagues & Cups
          </h1>

          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <input
              type="text"
              placeholder="Search by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full md:w-1/3 p-3 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-purple"
            />
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
            {isLoading
              ? Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => (
                  <DirectoryCardSkeleton key={i} />
                ))
              : paginatedData.map((league) => (
                  <DirectoryCard
                    key={league.id}
                    {...league}
                    // The 'isPopular' prop is now used to signify 'isActive'
                    isPopular={activeLeagueIds?.includes(league.id)}
                  />
                ))}
          </div>

          {!isLoading && paginatedData.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          )}

          {!isLoading && paginatedData.length === 0 && (
            <div className="text-center py-20 bg-brand-secondary rounded-lg">
              <p className="text-xl font-bold text-white">No Results Found</p>
              <p className="text-brand-muted mt-2">
                Try adjusting your search or filter.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
