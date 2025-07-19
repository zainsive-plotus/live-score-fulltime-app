// src/app/admin/auto-news/PredictionGenerationTab.tsx
"use client";

import { useEffect, useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import toast from "react-hot-toast";
import {
  Calendar,
  Sparkles,
  RefreshCw,
  Loader2,
  User,
  Info,
  CheckCircle,
  ExternalLink,
  Eye,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import Pagination from "@/components/Pagination";

// --- Interfaces (duplicated for now, ideally moved to a shared types/ folder) ---
interface IAIJournalist {
  _id: string;
  name: string;
  description?: string;
  tonePrompt: string;
  isActive: boolean;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

// Simplified fixture type for display purposes, will expand as needed for API calls
interface UpcomingFixture {
  fixture: {
    id: number;
    date: string; // ISO date string
    timezone: string;
    status: {
      long: string;
      short: string;
      elapsed: number | null;
    };
  };
  league: {
    id: number;
    name: string;
    logo: string;
  };
  teams: {
    home: { id: number; name: string; logo: string };
    away: { id: number; name: string; logo: string };
  };
  // Add a property to track if a prediction post has already been created for this fixture
  processedPostId?: string; // MongoDB ObjectId as string, refers to the Post
}

interface UpcomingFixturesResponse {
  fixtures: UpcomingFixture[];
  totalCount: number;
  currentPage: number;
  perPage: number;
}

// --- Fetcher functions ---

// Fetcher for AI Journalists (re-used)
const fetchAIJournalists = async (): Promise<IAIJournalist[]> => {
  const { data } = await axios.get("/api/admin/ai-journalists");
  return data;
};

// New fetcher for upcoming fixtures for prediction
const fetchUpcomingFixturesForPrediction = async (
  page: number,
  limit: number
): Promise<UpcomingFixturesResponse> => {
  const { data } = await axios.get(
    `/api/admin/upcoming-fixtures-for-prediction?limit=${limit}&skip=${
      (page - 1) * limit
    }`
  );
  return data;
};

const ITEMS_PER_PAGE = 10;

export default function PredictionGenerationTab() {
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedJournalistId, setSelectedJournalistId] = useState<
    string | null
  >(null);

  // Track pending mutations for UI feedback
  const [processingFixtureId, setProcessingFixtureId] = useState<number | null>(
    null
  );

  // Query for AI Journalists
  const {
    data: journalists,
    isLoading: isLoadingJournalists,
    error: journalistsError,
  } = useQuery<IAIJournalist[]>({
    queryKey: ["aiJournalists"],
    queryFn: fetchAIJournalists,
    staleTime: 1000 * 60 * 5,
  });

  // Query for Upcoming Fixtures
  const {
    data: fixturesData,
    isLoading: isLoadingFixtures,
    error: fixturesError,
    refetch: refetchFixtures,
  } = useQuery<UpcomingFixturesResponse>({
    queryKey: ["upcomingFixturesForPrediction", currentPage, ITEMS_PER_PAGE],
    queryFn: () =>
      fetchUpcomingFixturesForPrediction(currentPage, ITEMS_PER_PAGE),
    staleTime: 1000 * 60, // Cache for 1 minute
    placeholderData: (previousData) => previousData,
  });

  // Set initial selected journalist to the first active one, or null
  useEffect(() => {
    if (journalists && selectedJournalistId === null) {
      const firstActive = journalists.find((j) => j.isActive);
      if (firstActive) {
        setSelectedJournalistId(firstActive._id);
      }
    }
  }, [journalists, selectedJournalistId]);

  // Mutation to generate prediction news
  const generatePredictionNewsMutation = useMutation({
    mutationFn: (payload: {
      fixtureId: number;
      journalistId: string;
      sportCategory: string;
    }) => axios.post("/api/admin/generate-prediction-news", payload),
    onSuccess: (data) => {
      toast.success(data.data.message || "Prediction news generated!");
      queryClient.invalidateQueries({
        queryKey: ["upcomingFixturesForPrediction"],
      }); // Refetch to update status
      queryClient.invalidateQueries({ queryKey: ["adminPosts"] }); // Invalidate admin news list
    },
    onError: (err: any) => {
      toast.error(
        err.response?.data?.error || "Failed to generate prediction news."
      );
    },
    onSettled: (data, error, variables) => {
      // Find the specific fixture and update its status client-side temporarily
      // while query invalidation is pending
      queryClient.setQueryData(
        ["upcomingFixturesForPrediction", currentPage, ITEMS_PER_PAGE],
        (oldData: UpcomingFixturesResponse | undefined) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            fixtures: oldData.fixtures.map((f) =>
              f.fixture.id === variables.fixtureId
                ? {
                    ...f,
                    processedPostId: data?.data.postId || f.processedPostId,
                  } // Mark as processed
                : f
            ),
          };
        }
      );
      setProcessingFixtureId(null);
    },
  });

  const handleGeneratePrediction = (fixture: UpcomingFixture) => {
    if (!selectedJournalistId) {
      toast.error("Please select an AI Journalist before generating.");
      return;
    }
    setProcessingFixtureId(fixture.fixture.id);
    generatePredictionNewsMutation.mutate({
      fixtureId: fixture.fixture.id,
      journalistId: selectedJournalistId,
      sportCategory: "football", // For now, predictions are assumed football
    });
  };

  const totalPages = fixturesData
    ? Math.ceil(fixturesData.totalCount / ITEMS_PER_PAGE)
    : 0;

  return (
    <div className="bg-brand-secondary p-6 rounded-lg mb-8 shadow-xl">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Sparkles size={24} /> Generate Prediction News
        </h2>
        <button
          onClick={() => refetchFixtures()}
          className="flex items-center gap-2 bg-gray-600 text-white font-bold py-2 px-4 rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={
            isLoadingFixtures || generatePredictionNewsMutation.isPending
          }
        >
          <RefreshCw
            size={18}
            className={isLoadingFixtures ? "animate-spin" : ""}
          />
          Refresh Matches
        </button>
      </div>

      <div className="flex items-center justify-between gap-4 mb-4">
        {/* --- AI Journalist Dropdown --- */}
        <div className="flex items-center gap-2">
          <User size={18} className="text-brand-muted" />
          <select
            value={selectedJournalistId || ""}
            onChange={(e) => setSelectedJournalistId(e.target.value || null)}
            className="p-2 rounded bg-gray-700 text-white border border-gray-600 text-sm"
            disabled={
              isLoadingJournalists || generatePredictionNewsMutation.isPending
            }
          >
            <option value="">
              {isLoadingJournalists
                ? "Loading Journalists..."
                : "Select AI Journalist"}
            </option>
            {journalists
              ?.filter((j) => j.isActive)
              .map((j) => (
                <option key={j._id} value={j._id}>
                  {j.name}
                </option>
              ))}
          </select>
        </div>
        {/* End AI Journalist Dropdown */}
        <span className="text-brand-muted text-sm ml-auto">
          Total Upcoming Matches: {fixturesData?.totalCount ?? 0}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-brand-light">
          <thead className="bg-gray-800/50 text-sm text-brand-muted uppercase">
            <tr>
              <th className="p-4">Match</th>
              <th className="p-4">League</th>
              <th className="p-4">Date & Time</th>
              <th className="p-4">Status</th>
              <th className="p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoadingFixtures ? (
              Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => (
                <tr
                  key={i}
                  className="border-t border-gray-700/50 animate-pulse"
                >
                  <td className="p-4">
                    <div className="h-4 bg-gray-700 rounded w-full"></div>
                  </td>
                  <td className="p-4">
                    <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                  </td>
                  <td className="p-4">
                    <div className="h-4 bg-gray-700 rounded w-1/2"></div>
                  </td>
                  <td className="p-4">
                    <div className="h-4 bg-gray-700 rounded w-1/3"></div>
                  </td>
                  <td className="p-4">
                    <div className="w-10 h-10 bg-gray-700 rounded-full"></div>
                  </td>
                </tr>
              ))
            ) : fixturesData?.fixtures?.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-brand-muted">
                  No upcoming matches found for prediction.
                </td>
              </tr>
            ) : (
              fixturesData?.fixtures?.map((fixture) => (
                <tr
                  key={fixture.fixture.id}
                  className={`border-t border-gray-700/50 transition-colors 
                                ${
                                  processingFixtureId === fixture.fixture.id
                                    ? "bg-brand-dark/50 animate-pulse"
                                    : fixture.processedPostId
                                    ? "bg-green-900/20"
                                    : "hover:bg-gray-800"
                                }`}
                >
                  <td className="p-4 font-medium flex items-center gap-3">
                    <img
                      src={fixture.teams.home.logo}
                      alt={fixture.teams.home.name}
                      className="w-6 h-6"
                    />
                    {fixture.teams.home.name} vs {fixture.teams.away.name}
                    <img
                      src={fixture.teams.away.logo}
                      alt={fixture.teams.away.name}
                      className="w-6 h-6"
                    />
                  </td>
                  <td className="p-4 text-brand-muted text-sm flex items-center gap-2">
                    <img
                      src={fixture.league.logo}
                      alt={fixture.league.name}
                      className="w-4 h-4"
                    />
                    {fixture.league.name}
                  </td>
                  <td className="p-4 text-brand-muted text-sm">
                    {format(
                      parseISO(fixture.fixture.date),
                      "dd MMM yyyy HH:mm"
                    )}
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full min-w-[75px] inline-flex justify-center items-center gap-1
                          ${
                            fixture.processedPostId
                              ? "bg-green-500/20 text-green-400"
                              : "bg-blue-500/20 text-blue-400"
                          }`}
                    >
                      {processingFixtureId === fixture.fixture.id ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : fixture.processedPostId ? (
                        <CheckCircle size={12} />
                      ) : (
                        <Info size={12} />
                      )}
                      {processingFixtureId === fixture.fixture.id
                        ? "Generating..."
                        : fixture.processedPostId
                        ? "Generated"
                        : "Not Generated"}
                    </span>
                  </td>
                  <td className="p-4 flex gap-2 items-center h-full">
                    {fixture.processedPostId ? (
                      <a
                        href={`/admin/news/edit/${fixture.processedPostId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 p-1 rounded-full bg-brand-dark"
                        title="View Generated Post"
                      >
                        <Eye size={18} />
                      </a>
                    ) : (
                      <button
                        onClick={() => handleGeneratePrediction(fixture)}
                        className="text-brand-purple hover:text-brand-purple/80 p-1 rounded-full bg-brand-dark"
                        title="Generate Prediction News"
                        disabled={
                          generatePredictionNewsMutation.isPending ||
                          !selectedJournalistId
                        }
                      >
                        <Sparkles size={18} />
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {fixturesData && fixturesData.fixtures.length > 0 && (
        <div className="p-6">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
    </div>
  );
}
