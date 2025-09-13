"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import toast from "react-hot-toast";
import { Play, Loader2, Server, Clock } from "lucide-react";

export default function CacheManagementClient() {
  const [statusMessage, setStatusMessage] = useState("");

  const warmCacheMutation = useMutation({
    mutationFn: () => axios.post("/api/admin/warm-all-caches"),
    onSuccess: (data) => {
      toast.success("Successfully started the cache warming process.");
      setStatusMessage(data.data.message);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Failed to start the process.");
      setStatusMessage("");
    },
  });

  const handleWarmCache = () => {
    if (
      window.confirm(
        "This will start pre-building all pages from your sitemaps. It can take a long time and will cause a spike in server usage. Are you sure you want to proceed?"
      )
    ) {
      setStatusMessage("Initiating...");
      warmCacheMutation.mutate();
    }
  };

  return (
    <div className="bg-brand-secondary p-6 rounded-lg shadow-xl">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 bg-brand-purple/20 text-brand-purple p-3 rounded-lg">
          <Server size={24} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Pre-build Site Cache</h2>
          <p className="text-brand-muted text-sm mt-1">
            Trigger a process to pre-build static HTML for every page listed in
            your sitemaps. This ensures the fastest possible experience for all
            visitors.
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-col sm:flex-row items-center gap-4 p-4 bg-brand-dark/50 rounded-lg">
        <button
          onClick={handleWarmCache}
          disabled={warmCacheMutation.isPending}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-wait"
        >
          {warmCacheMutation.isPending ? (
            <Loader2 size={20} className="animate-spin" />
          ) : (
            <Play size={20} />
          )}
          <span>
            {warmCacheMutation.isPending
              ? "Initiating..."
              : "Start Pre-building All Pages"}
          </span>
        </button>
        {statusMessage && (
          <div className="flex items-center gap-2 text-sm text-yellow-300">
            <Clock size={16} />
            <p className="flex-1">{statusMessage}</p>
          </div>
        )}
      </div>
    </div>
  );
}
