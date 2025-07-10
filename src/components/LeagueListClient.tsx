// src/components/LeagueListClient.tsx
"use client";

import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { League } from "@/types/api-football";
import DirectoryCard, {
  DirectoryCardSkeleton,
} from "@/components/DirectoryCard";
import Pagination from "@/components/Pagination";
import { Search, SearchX } from "lucide-react"; // Using SearchX for the empty state

const ITEMS_PER_PAGE = 15;

// Fetcher function for active league IDs (unchanged)
const fetchActiveLeagueIds = async (): Promise<number[]> => {
  const { data } = await axios.get("/api/active-leagues");
  return data;
};

interface LeagueListClientProps {
  initialAllLeagues: League[];
}

export default function LeagueListClient({
  initialAllLeagues,
}: LeagueListClientProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<"all" | "league" | "cup">("all");
  const [currentPage, setCurrentPage] = useState(1);

  // useQuery for active league IDs (unchanged)
  const { data: activeLeagueIds, isLoading: isLoadingActive } = useQuery({
    queryKey: ["activeLeagueIds"],
    queryFn: fetchActiveLeagueIds,
    staleTime: 1000 * 60 * 10,
  });

  // --- This is the main enhancement to the logic ---
  const filteredLeagues = useMemo(() => {
    const activeIdsSet = new Set(activeLeagueIds || []);

    const filtered = initialAllLeagues.filter((league) => {
      const matchesSearch = league.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesFilter =
        filter === "all" || league.type.toLowerCase() === filter;
      return matchesSearch && matchesFilter;
    });

    const activeLeagues = filtered.filter((l) => activeIdsSet.has(l.id));
    const inactiveLeagues = filtered.filter((l) => !activeIdsSet.has(l.id));

    activeLeagues.sort((a, b) => a.name.localeCompare(b.name));
    inactiveLeagues.sort((a, b) => a.name.localeCompare(b.name));

    return [...activeLeagues, ...inactiveLeagues];
  }, [initialAllLeagues, activeLeagueIds, searchTerm, filter]);

  const { paginatedData, totalPages } = useMemo(() => {
    const total = Math.ceil(filteredLeagues.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return {
      paginatedData: filteredLeagues.slice(startIndex, endIndex),
      totalPages: total,
    };
  }, [filteredLeagues, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filter]);

  return (
    <>
      {/* --- NEW: Control Panel --- */}
      <div className="bg-brand-secondary p-4 rounded-lg mb-8 flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-grow w-full">
          <Search
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted"
            size={20}
          />
          <input
            type="text"
            placeholder="Lig veya kupa adına göre ara..."
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
            All
          </button>
          <button
            onClick={() => setFilter("league")}
            className={`flex-1 md:flex-none px-4 py-1.5 rounded-md text-sm font-semibold transition-colors ${
              filter === "league"
                ? "bg-[var(--brand-accent)] text-white"
                : "text-text-muted hover:bg-gray-700/50"
            }`}
          >
            Ligler
          </button>
          <button
            onClick={() => setFilter("cup")}
            className={`flex-1 md:flex-none px-4 py-1.5 rounded-md text-sm font-semibold transition-colors ${
              filter === "cup"
                ? "bg-[var(--brand-accent)] text-white"
                : "text-text-muted hover:bg-gray-700/50"
            }`}
          >
            Bardaklar
          </button>
        </div>
      </div>

      {/* --- Main Content Area --- */}
      <div>
        {isLoadingActive ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => (
              <DirectoryCardSkeleton key={i} />
            ))}
          </div>
        ) : paginatedData.length > 0 ? (
          <>
            {/* --- NEW: Results Header --- */}
            <div className="mb-4">
              <h2 className="text-xl font-bold text-white">
                {filteredLeagues.length} Yarışma gösteriliyor
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {paginatedData.map((league) => (
                <DirectoryCard
                  key={league.id}
                  {...league}
                  isPopular={activeLeagueIds?.includes(league.id)}
                />
              ))}
            </div>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </>
        ) : (
          // --- NEW: Enhanced Empty State ---
          <div className="text-center py-20 bg-brand-secondary rounded-lg">
            <SearchX size={48} className="mx-auto text-text-muted mb-4" />
            <p className="text-xl font-bold text-white">Sonuç Bulunamadı</p>
            <p className="text-text-muted mt-2">
              "{searchTerm}" aramanız hiçbir yarışmayla eşleşmedi.
            </p>
          </div>
        )}
      </div>
    </>
  );
}
