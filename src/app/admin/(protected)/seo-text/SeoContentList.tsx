"use client";

import { useState, useMemo } from "react";
import { ISeoContent } from "@/models/SeoContent";
import { ILanguage } from "@/models/Language";
import { Search, Info, Loader2 } from "lucide-react";
import SeoContentRow from "./SeoContentRow";
import { League } from "@/types/api-football";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

const fetchAllLeagues = async (): Promise<{ leagues: League[] }> => {
  const { data } = await axios.get("/api/directory/standings-leagues");
  // Ensure the response structure is handled correctly
  return data;
};

interface SeoContentListProps {
  pageType: string;
  languages: ILanguage[];
  contentItems: ISeoContent[];
  isLoading: boolean; // ** NEW: isLoading prop **
}

export default function SeoContentList({
  pageType,
  languages,
  contentItems,
  isLoading, // ** NEW: Receive isLoading prop **
}: SeoContentListProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: leaguesData, isLoading: isLoadingLeagues } = useQuery({
    queryKey: ["allStandingsLeagues"],
    queryFn: fetchAllLeagues,
    staleTime: Infinity,
  });

  const entityNameMap = useMemo(() => {
    if (!leaguesData?.leagues) return new Map<string, string>();
    return new Map(
      leaguesData.leagues.map((l: League) => [l.id.toString(), l.name])
    );
  }, [leaguesData]);

  const contentGroups = useMemo(() => {
    const groups: Record<string, ISeoContent[]> = {};
    contentItems.forEach((item) => {
      if (!groups[item.entityId]) {
        groups[item.entityId] = [];
      }
      groups[item.entityId].push(item);
    });
    return Object.values(groups);
  }, [contentItems]);

  const filteredGroups = useMemo(() => {
    if (searchTerm.length < 3) return contentGroups;
    return contentGroups.filter((group) => {
      const entityName = entityNameMap.get(group[0].entityId) || "";
      return entityName.toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [contentGroups, entityNameMap, searchTerm]);

  const isListLoading = isLoading || isLoadingLeagues;

  return (
    <div className="bg-brand-secondary rounded-lg overflow-hidden border border-gray-700/50">
      <div className="p-4 border-b border-gray-700/50 flex justify-between items-center">
        <h2 className="text-xl font-bold text-white">Generated Content</h2>
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
      ) : filteredGroups.length > 0 ? (
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
              {filteredGroups.map((group) => (
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
      ) : (
        <div className="text-center py-20 text-brand-muted">
          <Info size={32} className="mx-auto mb-3" />
          <p>No generated content found for this page type.</p>
        </div>
      )}
    </div>
  );
}
