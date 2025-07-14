"use client";

import { useState, useMemo, useEffect } from "react";
import Pagination from "./Pagination";
import { Search, SearchX } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import TeamDirectoryCard, {
  TeamDirectoryCardSkeleton,
} from "./TeamDirectoryCard";

const ITEMS_PER_PAGE = 18;

interface TeamData {
  team: any;
  venue: any;
}

interface TeamsByCountryClientProps {
  initialTeams: TeamData[];
}

export default function TeamsByCountryClient({
  initialTeams,
}: TeamsByCountryClientProps) {
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
    <>
      <div className="relative flex-grow w-full mb-8">
        <Search
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted"
          size={20}
        />
        <input
          type="text"
          placeholder={t("search_by_team_name_placeholder")}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-brand-secondary border border-gray-700/50 rounded-lg p-3 pl-12 text-white focus:outline-none focus:ring-2 focus:ring-brand-purple"
        />
      </div>

      {paginatedData.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {paginatedData.map((teamData) => (
              <TeamDirectoryCard
                key={teamData.team.id}
                team={teamData.team}
                venue={teamData.venue}
              />
            ))}
          </div>
          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          )}
        </>
      ) : (
        <div className="col-span-full text-center py-20 bg-brand-secondary rounded-lg">
          <SearchX size={32} className="mx-auto text-brand-muted mb-3" />
          <p className="text-xl font-bold text-white">
            {t("no_teams_found_title")}
          </p>
          <p className="text-brand-muted mt-2">
            {t("no_teams_found_subtitle", { searchTerm })}
          </p>
        </div>
      )}
    </>
  );
}
