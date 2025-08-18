// ===== src/app/admin/teams/page.tsx =====

"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import toast from "react-hot-toast";
import Image from "next/image";
import {
  DownloadCloud,
  Loader2,
  Database,
  Clock,
  Search,
  Users,
} from "lucide-react";
import AdminPagination from "@/components/admin/AdminPagination";
import { proxyImageUrl } from "@/lib/image-proxy";
import { useDebounce } from "@/hooks/useDebounce";

interface ITeam {
  _id: string;
  teamId: number;
  name: string;
  logoUrl: string;
  country: string;
  founded: number | null;
  venueName: string | null;
  venueCity: string | null;
}

interface TeamsResponse {
  teams: ITeam[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
  };
}

const fetchTeams = async (
  page: number,
  searchQuery: string
): Promise<TeamsResponse> => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: "20",
    search: searchQuery,
  });
  const { data } = await axios.get(`/api/admin/teams?${params.toString()}`);
  return data;
};

const fetchAndStoreTeams = async (): Promise<{ count: number }> => {
  const { data } = await axios.post("/api/admin/teams/sync");
  return data;
};

const getTeamsMetadata = async (): Promise<{
  count: number;
  lastUpdated: string | null;
}> => {
  const { data } = await axios.get("/api/admin/teams/metadata");
  return data;
};

export default function AdminTeamsPage() {
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const { data: teamsData, isLoading: isLoadingTeams } =
    useQuery<TeamsResponse>({
      queryKey: ["adminTeams", currentPage, debouncedSearchTerm],
      queryFn: () => fetchTeams(currentPage, debouncedSearchTerm),
      placeholderData: (previousData) => previousData,
    });

  const {
    data: metadata,
    isLoading: isLoadingMetadata,
    refetch: refetchMetadata,
  } = useQuery({
    queryKey: ["teamsAdminMetadata"],
    queryFn: getTeamsMetadata,
  });

  const syncMutation = useMutation({
    mutationFn: fetchAndStoreTeams,
    onSuccess: (data) => {
      toast.success(`Successfully fetched and stored ${data.count} teams!`);
      refetchMetadata();
      queryClient.invalidateQueries({ queryKey: ["adminTeams"] });
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
        "This will update all teams from the external API based on your leagues. This can take several minutes. Are you sure?"
      )
    ) {
      syncMutation.mutate();
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white flex items-center gap-2">
          <Users size={28} /> Manage Teams Database
        </h1>
      </div>

      <div className="bg-brand-secondary p-6 rounded-lg shadow-xl mb-8 space-y-6">
        <div>
          <h2 className="text-xl font-bold text-white mb-2">
            Sync with External API
          </h2>
          <p className="text-brand-muted text-sm mb-4">
            Click this button to fetch all teams for the current season based on
            the leagues in your database.
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
              {syncMutation.isPending ? "Syncing..." : "Sync All Teams"}
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
                <span className="font-semibold">Total Teams:</span>
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
              placeholder="Search by team name or country..."
              className="w-full bg-gray-800 border border-gray-600 rounded-lg p-2 pl-10 text-white placeholder:text-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-purple"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-brand-light">
            <thead className="bg-gray-800/50 text-sm text-brand-muted uppercase">
              <tr>
                <th className="p-4">Team</th>
                <th className="p-4">Country</th>
                <th className="p-4">Venue</th>
                <th className="p-4 text-center">Founded</th>
              </tr>
            </thead>
            <tbody>
              {isLoadingTeams
                ? Array.from({ length: 10 }).map((_, i) => (
                    <tr key={i} className="border-t border-gray-700/50">
                      <td colSpan={4} className="p-4 h-12 animate-pulse">
                        <div className="h-5 bg-gray-700 rounded"></div>
                      </td>
                    </tr>
                  ))
                : teamsData?.teams.map((team) => (
                    <tr key={team._id} className="border-t border-gray-700/50">
                      <td className="p-4 font-medium flex items-center gap-3">
                        <Image
                          src={proxyImageUrl(team.logoUrl)}
                          alt={team.name}
                          width={28}
                          height={28}
                          className="bg-white rounded-full p-0.5"
                        />
                        <span>{team.name}</span>
                      </td>
                      <td className="p-4 text-brand-muted">{team.country}</td>
                      <td className="p-4 text-brand-muted">
                        {team.venueName || "N/A"}
                      </td>
                      <td className="p-4 text-brand-muted text-center">
                        {team.founded || "-"}
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
        {teamsData && teamsData.pagination.totalPages > 1 && (
          <div className="p-4 border-t border-gray-700/50">
            <AdminPagination
              currentPage={currentPage}
              totalPages={teamsData.pagination.totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>
    </div>
  );
}
