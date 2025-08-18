// ===== src/app/admin/predictions/page.tsx =====

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
  Trash2,
  TrendingUp,
} from "lucide-react";
import AdminPagination from "@/components/admin/AdminPagination";
import { proxyImageUrl } from "@/lib/image-proxy";
import { format } from "date-fns";

interface IPrediction {
  _id: string;
  fixtureId: number;
  fixtureDate: string;
  teams: {
    home: { name: string; logo: string };
    away: { name: string; logo: string };
  };
  league: { name: string };
  prediction: { home: number; draw: number; away: number };
}

interface PredictionsResponse {
  predictions: IPrediction[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
  };
}

const fetchPredictions = async (page: number): Promise<PredictionsResponse> => {
  const params = new URLSearchParams({ page: page.toString(), limit: "15" });
  const { data } = await axios.get(
    `/api/admin/predictions?${params.toString()}`
  );
  return data;
};

const syncPredictions = async (
  days: number
): Promise<{ message: string; newPredictions: number; skipped: number }> => {
  const { data } = await axios.post("/api/admin/predictions/sync", { days });
  return data;
};

const getPredictionsMetadata = async (): Promise<{
  count: number;
  lastUpdated: string | null;
}> => {
  const { data } = await axios.get("/api/admin/predictions/metadata");
  return data;
};

const clearPredictions = async (): Promise<{ message: string }> => {
  const { data } = await axios.delete("/api/admin/predictions/clear");
  return data;
};

export default function AdminPredictionsPage() {
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const [syncDays, setSyncDays] = useState(7);

  const { data: predictionsData, isLoading: isLoadingPredictions } =
    useQuery<PredictionsResponse>({
      queryKey: ["adminPredictions", currentPage],
      queryFn: () => fetchPredictions(currentPage),
      placeholderData: (previousData) => previousData,
    });

  const {
    data: metadata,
    isLoading: isLoadingMetadata,
    refetch: refetchMetadata,
  } = useQuery({
    queryKey: ["predictionsAdminMetadata"],
    queryFn: getPredictionsMetadata,
  });

  const syncMutation = useMutation({
    mutationFn: () => syncPredictions(syncDays),
    onSuccess: (data) => {
      toast.success(data.message);
      refetchMetadata();
      queryClient.invalidateQueries({ queryKey: ["adminPredictions"] });
    },
    onError: (error: any) =>
      toast.error(error.response?.data?.error || "Sync failed."),
  });

  const clearMutation = useMutation({
    mutationFn: clearPredictions,
    onSuccess: (data) => {
      toast.success(data.message);
      refetchMetadata();
      queryClient.invalidateQueries({ queryKey: ["adminPredictions"] });
    },
    onError: (error: any) =>
      toast.error(error.response?.data?.error || "Clear operation failed."),
  });

  const handleSync = () => {
    if (
      window.confirm(
        `This will fetch and generate predictions for the next ${syncDays} days. This may take several minutes. Are you sure?`
      )
    ) {
      syncMutation.mutate();
    }
  };

  const handleClear = () => {
    if (
      window.confirm(
        "Are you sure you want to delete ALL generated predictions? This action cannot be undone."
      )
    ) {
      clearMutation.mutate();
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white flex items-center gap-2">
          <TrendingUp size={28} /> Manage Predictions
        </h1>
      </div>

      <div className="bg-brand-secondary p-6 rounded-lg shadow-xl mb-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-xl font-bold text-white mb-2">
              Sync Upcoming Predictions
            </h2>
            <p className="text-brand-muted text-sm mb-4">
              Fetch upcoming matches and generate predictions. Already generated
              predictions for upcoming matches will be skipped.
            </p>
            <div className="flex items-center gap-4">
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
                  {syncMutation.isPending ? "Syncing..." : "Run Sync"}
                </span>
              </button>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={syncDays}
                  onChange={(e) => setSyncDays(Number(e.target.value))}
                  min="1"
                  max="7"
                  className="w-20 p-2 rounded bg-gray-700 text-white border border-gray-600"
                />
                <label className="text-sm font-medium text-brand-light">
                  Days
                </label>
              </div>
            </div>
          </div>
          <div className="md:border-l border-gray-700/50 md:pl-8">
            <h2 className="text-xl font-bold text-white mb-2">
              Database Actions
            </h2>
            <p className="text-brand-muted text-sm mb-4">
              Manage the predictions collection in the database.
            </p>
            <button
              onClick={handleClear}
              disabled={clearMutation.isPending}
              className="inline-flex items-center gap-2 bg-red-800 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-900 disabled:opacity-50 disabled:cursor-wait"
            >
              {clearMutation.isPending ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <Trash2 size={20} />
              )}
              <span>
                {clearMutation.isPending
                  ? "Clearing..."
                  : "Clear All Predictions"}
              </span>
            </button>
          </div>
        </div>

        <div className="pt-6 border-t border-gray-700/50">
          <h2 className="text-xl font-bold text-white mb-2">Database Status</h2>
          {isLoadingMetadata ? (
            <div className="h-8 w-2/3 bg-gray-700 rounded-md animate-pulse"></div>
          ) : (
            <div className="flex items-center gap-6 text-brand-light">
              <div className="flex items-center gap-2">
                <Database size={18} />
                <span className="font-semibold">Total Predictions:</span>
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
        <div className="overflow-x-auto">
          <table className="w-full text-left text-brand-light">
            <thead className="bg-gray-800/50 text-sm text-brand-muted uppercase">
              <tr>
                <th className="p-4">Match</th>
                <th className="p-4">League</th>
                <th className="p-4">Date</th>
                <th className="p-4 text-center">Home %</th>
                <th className="p-4 text-center">Draw %</th>
                <th className="p-4 text-center">Away %</th>
              </tr>
            </thead>
            <tbody>
              {isLoadingPredictions
                ? Array.from({ length: 10 }).map((_, i) => (
                    <tr key={i} className="border-t border-gray-700/50">
                      <td colSpan={6} className="p-4 h-12 animate-pulse">
                        <div className="h-5 bg-gray-700 rounded"></div>
                      </td>
                    </tr>
                  ))
                : predictionsData?.predictions.map((p) => (
                    <tr key={p._id} className="border-t border-gray-700/50">
                      <td className="p-4 font-medium flex items-center gap-3">
                        <Image
                          src={proxyImageUrl(p.teams.home.logo)}
                          alt={p.teams.home.name}
                          width={24}
                          height={24}
                          className="bg-white rounded-full p-0.5"
                        />
                        <span>
                          {p.teams.home.name} vs {p.teams.away.name}
                        </span>
                        <Image
                          src={proxyImageUrl(p.teams.away.logo)}
                          alt={p.teams.away.name}
                          width={24}
                          height={24}
                          className="bg-white rounded-full p-0.5"
                        />
                      </td>
                      <td className="p-4 text-brand-muted text-sm">
                        {p.league.name}
                      </td>
                      <td className="p-4 text-brand-muted text-sm">
                        {format(new Date(p.fixtureDate), "dd MMM yyyy, HH:mm")}
                      </td>
                      <td className="p-4 text-center font-bold text-green-400">
                        {p.prediction.home}%
                      </td>
                      <td className="p-4 text-center font-bold text-yellow-400">
                        {p.prediction.draw}%
                      </td>
                      <td className="p-4 text-center font-bold text-blue-400">
                        {p.prediction.away}%
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
        {predictionsData && predictionsData.pagination.totalPages > 1 && (
          <div className="p-4 border-t border-gray-700/50">
            <AdminPagination
              currentPage={currentPage}
              totalPages={predictionsData.pagination.totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>
    </div>
  );
}
