// ===== src/app/admin/leagues/page.tsx =====

"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import toast from "react-hot-toast";
import Image from "next/image";
import { DownloadCloud, Loader2, Database, Clock, Search } from "lucide-react";
import AdminPagination from "@/components/admin/AdminPagination";
import { proxyImageUrl } from "@/lib/image-proxy";
import { useDebounce } from "@/hooks/useDebounce";

interface ILeague {
  _id: string;
  leagueId: number;
  name: string;
  type: string;
  logoUrl: string;
  countryName: string;
  countryFlagUrl: string | null;
}

interface LeaguesResponse {
  leagues: ILeague[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
  };
}

const fetchLeagues = async (
  page: number,
  searchQuery: string
): Promise<LeaguesResponse> => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: "20",
    search: searchQuery,
  });
  const { data } = await axios.get(`/api/admin/leagues?${params.toString()}`);
  return data;
};

const fetchAndStoreLeagues = async (): Promise<{ count: number }> => {
  const { data } = await axios.post("/api/admin/leagues/sync");
  return data;
};

const getLeaguesMetadata = async (): Promise<{
  count: number;
  lastUpdated: string | null;
}> => {
  const { data } = await axios.get("/api/admin/leagues/metadata");
  return data;
};

export default function AdminLeaguesPage() {
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const { data: leaguesData, isLoading: isLoadingLeagues } =
    useQuery<LeaguesResponse>({
      queryKey: ["adminLeagues", currentPage, debouncedSearchTerm],
      queryFn: () => fetchLeagues(currentPage, debouncedSearchTerm),
      placeholderData: (previousData) => previousData,
    });

  const {
    data: metadata,
    isLoading: isLoadingMetadata,
    refetch: refetchMetadata,
  } = useQuery({
    queryKey: ["leaguesAdminMetadata"],
    queryFn: getLeaguesMetadata,
  });

  const syncMutation = useMutation({
    mutationFn: fetchAndStoreLeagues,
    onSuccess: (data) => {
      toast.success(`Successfully fetched and stored ${data.count} leagues!`);
      refetchMetadata();
      queryClient.invalidateQueries({ queryKey: ["adminLeagues"] });
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.error ||
          "An unexpected error occurred during sync."
      );
    },
  });

  const handleSync = () => {
    if (
      window.confirm(
        "This will update all leagues from the external API. This can take a minute. Are you sure?"
      )
    ) {
      syncMutation.mutate();
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white flex items-center gap-2">
          <Database size={28} /> Manage Leagues Database
        </h1>
      </div>

      <div className="bg-brand-secondary p-6 rounded-lg shadow-xl mb-8 space-y-6">
        <div>
          <h2 className="text-xl font-bold text-white mb-2">
            Sync with External API
          </h2>
          <p className="text-brand-muted text-sm mb-4">
            Click this button to fetch all leagues from the API and update your
            local database.
          </p>
          <button
            onClick={handleSync}
            disabled={syncMutation.isPending}
            className="inline-flex items-center gap-2 bg-brand-purple text-white font-bold py-2 px-4 rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-wait"
          >
            {syncMutation.isPending ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <DownloadCloud size={20} />
            )}
            <span>
              {syncMutation.isPending ? "Syncing..." : "Sync All Leagues"}
            </span>
          </button>
        </div>

        <div className="pt-6 border-t border-gray-700/50">
          <h2 className="text-xl font-bold text-white mb-2">Database Status</h2>
          {isLoadingMetadata ? (
            <div className="h-8 w-2/3 bg-gray-700 rounded-md animate-pulse"></div>
          ) : (
            <div className="flex items-center gap-6 text-brand-light">
              <div className="flex items-center gap-2">
                <Database size={18} />
                <span className="font-semibold">Total:</span>
                <span className="font-bold text-white text-lg">
                  {metadata?.count ?? 0}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={18} />
                <span className="font-semibold">Last Updated:</span>
                <span className="font-bold text-white text-lg">
                  {metadata?.lastUpdated
                    ? new Date(metadata.lastUpdated).toLocaleString()
                    : "Never"}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-brand-secondary rounded-lg shadow-xl">
        <div className="p-4 border-b border-gray-700/50">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted"
              size={20}
            />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by league or country name..."
              className="w-full bg-gray-800 border border-gray-600 rounded-lg p-2 pl-10 text-white placeholder:text-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-purple"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-brand-light">
            <thead className="bg-gray-800/50 text-sm text-brand-muted uppercase">
              <tr>
                <th className="p-4">League</th>
                <th className="p-4">Country</th>
                <th className="p-4">Type</th>
                <th className="p-4 text-center">API ID</th>
              </tr>
            </thead>
            <tbody>
              {isLoadingLeagues
                ? Array.from({ length: 10 }).map((_, i) => (
                    <tr key={i} className="border-t border-gray-700/50">
                      <td colSpan={4} className="p-4 h-12 animate-pulse">
                        <div className="h-5 bg-gray-700 rounded"></div>
                      </td>
                    </tr>
                  ))
                : leaguesData?.leagues.map((league) => (
                    <tr
                      key={league._id}
                      className="border-t border-gray-700/50"
                    >
                      <td className="p-4 font-medium flex items-center gap-3">
                        <Image
                          src={proxyImageUrl(league.logoUrl)}
                          alt={league.name}
                          width={28}
                          height={28}
                          className="bg-white rounded-full p-0.5"
                        />
                        <span>{league.name}</span>
                      </td>
                      <td className="p-4 text-brand-muted flex items-center gap-2">
                        {league.countryFlagUrl && (
                          <Image
                            src={proxyImageUrl(league.countryFlagUrl)}
                            alt={league.countryName}
                            width={20}
                            height={15}
                          />
                        )}
                        <span>{league.countryName}</span>
                      </td>
                      <td className="p-4 text-brand-muted">{league.type}</td>
                      <td className="p-4 text-brand-muted text-center font-mono">
                        {league.leagueId}
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
        {leaguesData && leaguesData.pagination.totalPages > 1 && (
          <div className="p-4 border-t border-gray-700/50">
            <AdminPagination
              currentPage={currentPage}
              totalPages={leaguesData.pagination.totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>
    </div>
  );
}
