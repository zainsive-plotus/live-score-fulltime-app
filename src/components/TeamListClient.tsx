"use client";

import { useState, useMemo, useEffect } from "react";
import { Search, SearchX } from "lucide-react";
import TeamDirectoryCard, {
  TeamDirectoryCardSkeleton,
} from "./TeamDirectoryCard";
import Pagination from "./Pagination";
import { useTranslation } from "@/hooks/useTranslation";

const ITEMS_PER_PAGE = 21;

interface TeamData {
  team: { id: number; name: string; logo: string; country: string };
  venue: { name: string; city: string };
}

interface TeamListClientProps {
  initialTeams: TeamData[];
}

export default function TeamListClient({ initialTeams }: TeamListClientProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const { t } = useTranslation();

  const filteredTeams = useMemo(() => {
    if (!initialTeams) return [];

    return searchTerm.length > 2
      ? initialTeams.filter((item) =>
          item.team.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
      : initialTeams;
  }, [initialTeams, searchTerm]);

  const { paginatedData, totalPages } = useMemo(() => {
    const total = Math.ceil(filteredTeams.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return {
      paginatedData: filteredTeams.slice(startIndex, endIndex),
      totalPages: total,
    };
  }, [filteredTeams, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  return (
    <div>
      <div className="bg-brand-secondary p-4 rounded-lg mb-8">
        <div className="relative w-full">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted"
            size={20}
          />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t("search_by_team_name_placeholder")}
            className="w-full bg-[var(--color-primary)] border border-gray-700/50 rounded-lg p-3 pl-12 text-white placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-[var(--brand-accent)]"
          />
        </div>
      </div>

      <div>
        {initialTeams.length === 0 ? (
          <div className="text-center py-20 bg-brand-secondary rounded-lg">
            <p className="text-xl font-bold text-white">
              {t("error_loading_teams_title")}
            </p>
            <p className="text-text-muted mt-2">
              {t("error_loading_teams_subtitle")}
            </p>
          </div>
        ) : paginatedData.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {paginatedData.map((item) => (
                <TeamDirectoryCard
                  key={item.team.id}
                  team={item.team}
                  venue={item.venue}
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
          <div className="text-center py-20 bg-brand-secondary rounded-lg">
            <SearchX size={48} className="mx-auto text-text-muted mb-4" />
            <p className="text-xl font-bold text-white">
              {t("no_teams_found_title")}
            </p>
            <p className="text-text-muted mt-2">
              {t("no_teams_found_subtitle", { searchTerm: searchTerm })}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
