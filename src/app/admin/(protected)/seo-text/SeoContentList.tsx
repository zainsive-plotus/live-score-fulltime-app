// ===== src/components/admin/seo-text/SeoContentList.tsx =====

"use client";

import { useState, useMemo, useEffect } from "react";
import { ISeoContent } from "@/models/SeoContent";
import { ILanguage } from "@/models/Language";
import { Search, Info, Loader2 } from "lucide-react";
import SeoContentRow from "./SeoContentRow";
import { League } from "@/types/api-football";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useDebounce } from "@/hooks/useDebounce";
import AdminPagination from "@/components/admin/AdminPagination";

const fetchAllLeagues = async (): Promise<{ leagues: League[] }> => {
  const { data } = await axios.get("/api/directory/standings-leagues");
  return data;
};

const fetchPaginatedContent = async (
  pageType: string,
  page: number,
  search: string
) => {
  const params = new URLSearchParams({
    pageType,
    page: page.toString(),
    limit: "10",
    search,
  });
  const { data } = await axios.get(
    `/api/admin/seo-content/paginated?${params.toString()}`
  );
  return data;
};

interface SeoContentListProps {
  pageType: string;
  languages: ILanguage[];
  initialData: {
    contentGroups: ISeoContent[][];
    pagination: { currentPage: number; totalPages: number; totalCount: number };
  };
}

export default function SeoContentList({
  pageType,
  languages,
  initialData,
}: SeoContentListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  // MODIFIED: Added optional chaining and a fallback to prevent crashes if initialData is ever malformed.
  const [currentPage, setCurrentPage] = useState(
    initialData?.pagination?.currentPage ?? 1
  );
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const { data: leaguesData, isLoading: isLoadingLeagues } = useQuery({
    queryKey: ["allStandingsLeagues"],
    queryFn: fetchAllLeagues,
    staleTime: Infinity,
  });

  const { data: contentData, isLoading: isLoadingContent } = useQuery({
    queryKey: [
      "paginatedSeoContent",
      pageType,
      currentPage,
      debouncedSearchTerm,
    ],
    queryFn: () =>
      fetchPaginatedContent(pageType, currentPage, debouncedSearchTerm),
    // Use initialData only if it exists and we're on page 1 with no search
    initialData:
      currentPage === 1 && !debouncedSearchTerm && initialData
        ? {
            contentGroups: initialData.contentGroups,
            pagination: initialData.pagination,
          }
        : undefined,
    keepPreviousData: true,
    staleTime: 1000 * 60,
  });

  const entityNameMap = useMemo(() => {
    if (!leaguesData?.leagues) return new Map<string, string>();
    return new Map(
      leaguesData.leagues.map((l: League) => [l.id.toString(), l.name])
    );
  }, [leaguesData]);

  useEffect(() => {
    if (debouncedSearchTerm) {
      setCurrentPage(1);
    }
  }, [debouncedSearchTerm]);

  const isListLoading = isLoadingContent && !contentData;

  // MODIFIED: Added safety checks to prevent crashes when accessing data.
  const contentGroups =
    contentData?.contentGroups || initialData?.contentGroups || [];
  const pagination = contentData?.pagination ||
    initialData?.pagination || { currentPage: 1, totalPages: 1, totalCount: 0 };

  return (
    <div className="bg-brand-secondary rounded-lg overflow-hidden border border-gray-700/50">
      <div className="p-4 border-b border-gray-700/50 flex justify-between items-center">
        <h2 className="text-xl font-bold text-white">
          Generated Content ({pagination.totalCount})
        </h2>
        <div className="relative w-full max-w-xs">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
            size={18}
          />
          <input
            type="text"
            placeholder="Search by league name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-brand-dark border border-gray-600 rounded-md py-2 pl-10 pr-4 text-sm text-white"
          />
        </div>
      </div>

      {isListLoading ? (
        <div className="flex items-center justify-center p-20">
          <Loader2 size={32} className="animate-spin text-brand-muted" />
        </div>
      ) : contentGroups.length > 0 ? (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-800/50 text-sm text-brand-muted uppercase">
                <tr>
                  <th className="p-4 w-1/3">Entity (League)</th>
                  <th className="p-4 w-1/2">Translations</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {contentGroups.map((group) => (
                  <SeoContentRow
                    key={group[0].entityId}
                    pageType={pageType}
                    group={group}
                    entityName={
                      entityNameMap.get(group[0].entityId) ||
                      `ID: ${group[0].entityId}`
                    }
                    allActiveLanguages={languages}
                  />
                ))}
              </tbody>
            </table>
          </div>
          {pagination.totalPages > 1 && (
            <div className="p-4 border-t border-gray-700/50">
              <AdminPagination
                currentPage={currentPage}
                totalPages={pagination.totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-20 text-brand-muted">
          <Info size={32} className="mx-auto mb-3" />
          <p>No generated content found for this page type.</p>
        </div>
      )}
    </div>
  );
}
