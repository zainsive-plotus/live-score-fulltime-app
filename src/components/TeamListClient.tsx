"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import { Search, SearchX } from "lucide-react";
import TeamDirectoryCard, {
  TeamDirectoryCardSkeleton,
} from "./TeamDirectoryCard";
import Pagination from "./Pagination";
import { useTranslation } from "@/hooks/useTranslation";
import { useDebounce } from "@/hooks/useDebounce";

const ITEMS_PER_PAGE = 21;

interface TeamData {
  team: {
    id: number;
    name: string;
    logo: string;
    country: string;
    founded?: number;
  };
  venue: { name: string; city: string };
}

interface PaginatedTeamsResponse {
  teams: TeamData[];
  pagination: { currentPage: number; totalPages: number; totalCount: number };
}

const fetchPaginatedTeams = async (
  page: number,
  search: string
): Promise<PaginatedTeamsResponse> => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: ITEMS_PER_PAGE.toString(),
    search,
  });
  const { data } = await axios.get(`/api/teams/paginated?${params.toString()}`);
  return data;
};

interface TeamListClientProps {
  initialData: PaginatedTeamsResponse;
}

export default function TeamListClient({ initialData }: TeamListClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { t } = useTranslation();

  const [searchTerm, setSearchTerm] = useState(searchParams.get("q") || "");
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const currentPage = Number(searchParams.get("page")) || 1;

  const { data: teamsResponse, isLoading } = useQuery({
    queryKey: ["paginatedTeams", currentPage, debouncedSearchTerm],
    queryFn: () => fetchPaginatedTeams(currentPage, debouncedSearchTerm),
    placeholderData: (previousData) => previousData,
    // Use initialData only for the first page and when not searching
    initialData:
      currentPage === 1 && !debouncedSearchTerm ? initialData : undefined,
  });

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page.toString());
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSearchTerm = e.target.value;
    setSearchTerm(newSearchTerm);
    const params = new URLSearchParams(searchParams.toString());
    params.set("q", newSearchTerm);
    params.set("page", "1");
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const isLoadingData = isLoading && !teamsResponse;

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
            onChange={handleSearchChange}
            placeholder={t("search_by_team_name_placeholder")}
            className="w-full bg-[var(--color-primary)] border border-gray-700/50 rounded-lg p-3 pl-12 text-white placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-[var(--brand-accent)]"
          />
        </div>
      </div>

      <div>
        {isLoadingData ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => (
              <TeamDirectoryCardSkeleton key={i} />
            ))}
          </div>
        ) : teamsResponse && teamsResponse.teams.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {teamsResponse.teams.map((item) => (
                <TeamDirectoryCard
                  key={item.team.id}
                  team={item.team}
                  venue={item.venue}
                />
              ))}
            </div>
            {teamsResponse.pagination.totalPages > 1 && (
              <Pagination
                currentPage={teamsResponse.pagination.currentPage}
                totalPages={teamsResponse.pagination.totalPages}
                onPageChange={handlePageChange}
              />
            )}
          </>
        ) : (
          <div className="text-center py-20 bg-brand-secondary rounded-lg">
            <SearchX size={48} className="mx-auto text-text-muted mb-4" />
            <p className="text-xl font-bold text-white">
              {t("no_teams_found_title")}
            </p>
            <p className="text-text-muted mt-2">
              {t("no_teams_found_subtitle", {
                searchTerm: debouncedSearchTerm,
              })}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
