// src/app/admin/auto-news/page.tsx
"use client";

import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import toast from "react-hot-toast";
import {
  Newspaper,
  Settings,
  DownloadCloud,
  Sparkles,
  AlertCircle,
  RefreshCw,
  Trash2,
  ExternalLink,
  Copy,
  Loader2,
  Hourglass,
  CheckCircle,
  XCircle,
  User, // Added User icon for dropdown
} from "lucide-react";
import { format, parseISO } from "date-fns";
import Image from "next/image";
import Link from "next/link";
import Pagination from "@/components/Pagination";
import PredictionGenerationTab from "./PredictionGenerationTab"; // <-- NEW IMPORT

// Define interfaces for API responses (ensure these match your models/API)
interface IExternalNewsArticle {
  _id: string; // MongoDB's _id
  articleId: string; // ID from newsdata.io
  title: string;
  link: string;
  pubDate: string; // Will be ISO string, convert to Date
  imageUrl?: string | null;
  status: "fetched" | "processing" | "processed" | "skipped" | "error";
  processedPostId?: string; // MongoDB ObjectId as string
  createdAt: string;
  updatedAt: string;
}

interface ExternalNewsResponse {
  articles: IExternalNewsArticle[];
  totalCount: number;
  currentPage: number;
  perPage: number;
}

// --- Modified IAIPrompt for type field (UPDATED HERE) ---
interface IAIPrompt {
  _id: string;
  name: string;
  prompt: string;
  description?: string;
  type: "title" | "content" | "prediction_content"; // <-- Added prediction_content type
}

// Assuming IAIJournalist interface is defined
interface IAIJournalist {
  _id: string;
  name: string;
  description?: string;
  tonePrompt: string;
  isActive: boolean;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

// --- Fetcher functions ---
const fetchExternalNews = async (
  page: number,
  limit: number,
  statusFilter: string
): Promise<ExternalNewsResponse> => {
  const { data } = await axios.get(
    `/api/admin/external-news?limit=${limit}&skip=${
      (page - 1) * limit
    }&status=${statusFilter}`
  );
  return data;
};

// --- Updated fetchAIPrompt to optionally fetch by type ---
const fetchAIPrompt = async (
  name: string,
  type: "title" | "content" | "prediction_content" // Updated type for new prompt
): Promise<IAIPrompt> => {
  const { data } = await axios.get(
    `/api/admin/ai-prompt?name=${encodeURIComponent(name)}&type=${type}`
  );
  return data;
};

// Fetcher for AI Journalists (re-used by Prediction Tab)
const fetchAIJournalists = async (): Promise<IAIJournalist[]> => {
  const { data } = await axios.get("/api/admin/ai-journalists");
  return data;
};

// --- Define the fixed names for prompts ---
const TITLE_PROMPT_NAME = "AI Title Generation";
const CONTENT_PROMPT_NAME = "AI Content Generation";
const PREDICTION_PROMPT_NAME = "AI Prediction Content Generation"; // <-- NEW PROMPT NAME

export default function AdminAutoNewsPage() {
  const queryClient = useQueryClient();

  // --- New state for active tab ---
  const [activeTab, setActiveTab] = useState<
    "settings" | "external_news" | "prediction_generation"
  >("settings"); // Default to settings

  // --- State for News Fetching Form ---
  const [newsQuery, setNewsQuery] = useState("football OR soccer");
  const [newsLanguage, setNewsLanguage] = useState("en");
  const [newsCountry, setNewsCountry] = useState<string[]>(["gb", "us"]); // Default to UK and US
  const [newsCategory, setNewsCategory] = useState<string[]>(["sports"]); // Default to sports

  // --- State for AI Prompt Management ---
  const [titlePromptContent, setTitlePromptContent] = useState("");
  const [titlePromptDescription, setTitlePromptDescription] = useState("");
  const [isEditingTitlePrompt, setIsEditingTitlePrompt] = useState(false);

  const [contentPromptContent, setContentPromptContent] = useState("");
  const [contentPromptDescription, setContentPromptDescription] = useState("");
  const [isEditingContentPrompt, setIsEditingContentPrompt] = useState(false);

  // --- NEW: State for Prediction Prompt Management ---
  const [predictionPromptContent, setPredictionPromptContent] = useState("");
  const [predictionPromptDescription, setPredictionPromptDescription] =
    useState("");
  const [isEditingPredictionPrompt, setIsEditingPredictionPrompt] =
    useState(false);

  // --- State for External News List Pagination/Filters ---
  const [currentPage, setCurrentPage] = useState(1);
  const [articlesPerPage, setArticlesPerPage] = useState(10);
  const [statusFilter, setStatusFilter] = useState("fetched");

  // --- AI Journalist Selection (used by External News and Prediction Tabs) ---
  const [selectedJournalistId, setSelectedJournalistId] = useState<
    string | null
  >(null);

  // --- Track pending mutations for UI feedback (External News Tab) ---
  const [processingArticleId, setProcessingArticleId] = useState<string | null>(
    null
  );
  const [deletingArticleId, setDeletingArticleId] = useState<string | null>(
    null
  );

  // --- API Calls using TanStack Query ---

  // Query for external news articles (External News Tab)
  const {
    data: externalNewsData,
    isLoading: isLoadingNews,
    error: newsError,
    refetch: refetchExternalNews,
  } = useQuery<ExternalNewsResponse>({
    queryKey: ["externalNews", currentPage, articlesPerPage, statusFilter],
    queryFn: () =>
      fetchExternalNews(currentPage, articlesPerPage, statusFilter),
    staleTime: 1000 * 60,
    placeholderData: (previousData) => previousData,
    enabled: activeTab === "external_news", // Only fetch if this tab is active
  });

  // Query for AI Title Prompt (Settings Tab)
  const {
    data: titlePromptData,
    isLoading: isLoadingTitlePrompt,
    error: titlePromptError,
  } = useQuery<IAIPrompt>({
    queryKey: ["aiPrompt", TITLE_PROMPT_NAME, "title"],
    queryFn: () => fetchAIPrompt(TITLE_PROMPT_NAME, "title"),
    staleTime: 1000 * 60 * 5,
    enabled: activeTab === "settings", // Only fetch if this tab is active
  });

  // Query for AI Content Prompt (Settings Tab)
  const {
    data: contentPromptData,
    isLoading: isLoadingContentPrompt,
    error: contentPromptError,
  } = useQuery<IAIPrompt>({
    queryKey: ["aiPrompt", CONTENT_PROMPT_NAME, "content"],
    queryFn: () => fetchAIPrompt(CONTENT_PROMPT_NAME, "content"),
    staleTime: 1000 * 60 * 5,
    enabled: activeTab === "settings", // Only fetch if this tab is active
  });

  // --- NEW: Query for AI Prediction Content Prompt (Settings Tab) ---
  const {
    data: predictionPromptData,
    isLoading: isLoadingPredictionPrompt,
    error: predictionPromptError,
  } = useQuery<IAIPrompt>({
    queryKey: ["aiPrompt", PREDICTION_PROMPT_NAME, "prediction_content"],
    queryFn: () => fetchAIPrompt(PREDICTION_PROMPT_NAME, "prediction_content"),
    staleTime: 1000 * 60 * 5,
    enabled: activeTab === "settings", // Only fetch if this tab is active
  });

  // Query for AI Journalists (shared by External News and Prediction Tabs)
  const {
    data: journalists,
    isLoading: isLoadingJournalists,
    error: journalistsError,
  } = useQuery<IAIJournalist[]>({
    queryKey: ["aiJournalists"],
    queryFn: fetchAIJournalists,
    staleTime: 1000 * 60 * 5,
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

  // Sync title prompt data to state
  useEffect(() => {
    if (titlePromptData) {
      setTitlePromptContent(titlePromptData.prompt);
      setTitlePromptDescription(titlePromptData.description || "");
    }
  }, [titlePromptData]);

  // Sync content prompt data to state
  useEffect(() => {
    if (contentPromptData) {
      setContentPromptContent(contentPromptData.prompt);
      setContentPromptDescription(contentPromptData.description || "");
    }
  }, [contentPromptData]);

  // --- NEW: Sync prediction prompt data to state ---
  useEffect(() => {
    if (predictionPromptData) {
      setPredictionPromptContent(predictionPromptData.prompt);
      setPredictionPromptDescription(predictionPromptData.description || "");
    }
  }, [predictionPromptData]);

  // --- Mutations ---

  // Mutation to fetch news from newsdata.io (External News Tab)
  const fetchNewsMutation = useMutation({
    mutationFn: (payload: {
      query: string;
      language: string;
      country: string[];
      category: string[];
    }) => axios.post("/api/admin/fetch-external-news", payload),
    onSuccess: (data) => {
      toast.success(`Fetched ${data.data.newArticlesCount} new articles.`);
      queryClient.invalidateQueries({ queryKey: ["externalNews"] });
      setCurrentPage(1);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Failed to fetch news.");
    },
  });

  // --- Mutations for separate prompts (Settings Tab) ---
  const updateTitlePromptMutation = useMutation({
    mutationFn: (payload: { prompt: string; description?: string }) =>
      axios.put(
        `/api/admin/ai-prompt?name=${encodeURIComponent(
          TITLE_PROMPT_NAME
        )}&type=title`,
        payload
      ),
    onSuccess: (data) => {
      toast.success("AI Title Prompt updated successfully!");
      setTitlePromptContent(data.data.prompt);
      setTitlePromptDescription(data.data.description || "");
      setIsEditingTitlePrompt(false);
      queryClient.invalidateQueries({
        queryKey: ["aiPrompt", TITLE_PROMPT_NAME, "title"],
      });
    },
    onError: (err: any) => {
      toast.error(
        err.response?.data?.error || "Failed to update title prompt."
      );
    },
  });

  const updateContentPromptMutation = useMutation({
    mutationFn: (payload: { prompt: string; description?: string }) =>
      axios.put(
        `/api/admin/ai-prompt?name=${encodeURIComponent(
          CONTENT_PROMPT_NAME
        )}&type=content`,
        payload
      ),
    onSuccess: (data) => {
      toast.success("AI Content Prompt updated successfully!");
      setContentPromptContent(data.data.prompt);
      setContentPromptDescription(data.data.description || "");
      setIsEditingContentPrompt(false);
      queryClient.invalidateQueries({
        queryKey: ["aiPrompt", CONTENT_PROMPT_NAME, "content"],
      });
    },
    onError: (err: any) => {
      toast.error(
        err.response?.data?.error || "Failed to update content prompt."
      );
    },
  });

  // --- NEW: Mutation for Prediction Content Prompt (Settings Tab) ---
  const updatePredictionPromptMutation = useMutation({
    mutationFn: (payload: { prompt: string; description?: string }) =>
      axios.put(
        `/api/admin/ai-prompt?name=${encodeURIComponent(
          PREDICTION_PROMPT_NAME
        )}&type=prediction_content`,
        payload
      ),
    onSuccess: (data) => {
      toast.success("AI Prediction Prompt updated successfully!");
      setPredictionPromptContent(data.data.prompt);
      setPredictionPromptDescription(data.data.description || "");
      setIsEditingPredictionPrompt(false);
      queryClient.invalidateQueries({
        queryKey: ["aiPrompt", PREDICTION_PROMPT_NAME, "prediction_content"],
      });
    },
    onError: (err: any) => {
      toast.error(
        err.response?.data?.error || "Failed to update prediction prompt."
      );
    },
  });

  // Mutation to process an external news article with AI (External News Tab)
  const processArticleMutation = useMutation({
    mutationFn: (payload: {
      articleId: string;
      sportCategory: string;
      journalistId?: string | null;
    }) => {
      setProcessingArticleId(payload.articleId);
      return axios.post("/api/admin/process-external-news", payload);
    },
    onSuccess: (data) => {
      toast.success(data.data.message || "Article processed successfully!");
      queryClient.invalidateQueries({ queryKey: ["externalNews"] });
      queryClient.invalidateQueries({ queryKey: ["adminPosts"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Failed to process article.");
    },
    onSettled: () => {
      setProcessingArticleId(null);
    },
  });

  // Mutation to delete an external news article (External News Tab)
  const deleteArticleMutation = useMutation({
    mutationFn: (articleId: string) => {
      setDeletingArticleId(articleId);
      return axios.delete(`/api/admin/external-news?articleId=${articleId}`);
    },
    onSuccess: () => {
      toast.success("Article deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ["externalNews"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Failed to delete journalist.");
    },
    onSettled: () => {
      setDeletingArticleId(null);
    },
  });

  // --- Handlers ---
  const handleFetchNews = (e: React.FormEvent) => {
    e.preventDefault();
    fetchNewsMutation.mutate({
      query: newsQuery,
      language: newsLanguage,
      country: newsCountry,
      category: newsCategory,
    });
  };

  const handleUpdateTitlePrompt = (e: React.FormEvent) => {
    e.preventDefault();
    if (titlePromptContent.trim() === "") {
      toast.error("Title Prompt cannot be empty.");
      return;
    }
    updateTitlePromptMutation.mutate({
      prompt: titlePromptContent,
      description: titlePromptDescription,
    });
  };

  const handleUpdateContentPrompt = (e: React.FormEvent) => {
    e.preventDefault();
    if (contentPromptContent.trim() === "") {
      toast.error("Content Prompt cannot be empty.");
      return;
    }
    updateContentPromptMutation.mutate({
      prompt: contentPromptContent,
      description: contentPromptDescription,
    });
  };

  // --- NEW: Handle Update Prediction Prompt ---
  const handleUpdatePredictionPrompt = (e: React.FormEvent) => {
    e.preventDefault();
    if (predictionPromptContent.trim() === "") {
      toast.error("Prediction Prompt cannot be empty.");
      return;
    }
    updatePredictionPromptMutation.mutate({
      prompt: predictionPromptContent,
      description: predictionPromptDescription,
    });
  };

  const handleProcessArticle = (articleId: string) => {
    if (!selectedJournalistId) {
      toast.error("Please select an AI Journalist before processing.");
      return;
    }
    processArticleMutation.mutate({
      articleId,
      sportCategory: "football",
      journalistId: selectedJournalistId,
    });
  };

  const handleDeleteArticle = (articleId: string) => {
    if (
      window.confirm(
        `Are you sure you want to delete this external article? This cannot be undone.`
      )
    ) {
      deleteArticleMutation.mutate(articleId);
    }
  };

  const copyPromptToClipboard = (promptText: string) => {
    if (promptText) {
      navigator.clipboard.writeText(promptText);
      toast.success("Prompt copied to clipboard!");
    }
  };

  const totalPages = externalNewsData
    ? Math.ceil(externalNewsData.totalCount / articlesPerPage)
    : 0;

  // Country and Category options (simplified for now, could be dynamic from an API)
  const availableCountries = [
    { code: "us", name: "United States" },
    { code: "gb", name: "United Kingdom" },
    { code: "tr", name: "Turkey" },
    { code: "fr", name: "France" },
    { code: "de", name: "Germany" },
    { code: "es", name: "Spain" },
    { code: "it", name: "Italy" },
    { code: "br", name: "Brazil" },
    { code: "ar", name: "Argentina" },
    { code: "mx", name: "Mexico" },
    { code: "ca", name: "Canada" },
  ];
  const availableCategories = [
    { code: "sports", name: "Sports" },
    { code: "business", name: "Business" },
    { code: "health", name: "Health" },
    { code: "technology", name: "Technology" },
    { code: "entertainment", name: "Entertainment" },
    { code: "science", name: "Science" },
    { code: "politics", name: "Politics" },
    { code: "world", name: "World" },
  ];

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const options = Array.from(
      e.target.selectedOptions,
      (option) => option.value
    );
    setNewsCountry(options);
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const options = Array.from(
      e.target.selectedOptions,
      (option) => option.value
    );
    setNewsCategory(options);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white flex items-center gap-2">
          <Newspaper size={28} /> Automated News Engine
        </h1>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-700 mb-8">
        <button
          onClick={() => setActiveTab("settings")}
          className={`px-6 py-3 text-lg font-semibold ${
            activeTab === "settings"
              ? "text-brand-purple border-b-2 border-brand-purple"
              : "text-brand-muted hover:text-white"
          }`}
        >
          <Settings className="inline-block mr-2" size={20} /> AI Settings
        </button>
        <button
          onClick={() => setActiveTab("external_news")}
          className={`px-6 py-3 text-lg font-semibold ${
            activeTab === "external_news"
              ? "text-brand-purple border-b-2 border-brand-purple"
              : "text-brand-muted hover:text-white"
          }`}
        >
          <DownloadCloud className="inline-block mr-2" size={20} /> External
          News Processing
        </button>
        <button
          onClick={() => setActiveTab("prediction_generation")}
          className={`px-6 py-3 text-lg font-semibold ${
            activeTab === "prediction_generation"
              ? "text-brand-purple border-b-2 border-brand-purple"
              : "text-brand-muted hover:text-white"
          }`}
        >
          <Sparkles className="inline-block mr-2" size={20} /> Prediction
          Generation
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "settings" && (
        <div className="space-y-8">
          {/* --- AI PROMPT MANAGEMENT SECTION --- */}
          <div className="bg-brand-secondary p-6 rounded-lg shadow-xl">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2 mb-4">
              <Settings size={24} /> AI Prompts Configuration
            </h2>

            {/* Title Prompt Subsection */}
            <div className="mb-8 border border-gray-700 rounded-lg p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-white">
                  Title Generation Prompt
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => copyPromptToClipboard(titlePromptContent)}
                    className="text-brand-light hover:text-white flex items-center gap-1 bg-gray-700 py-1.5 px-3 rounded-md text-sm"
                    disabled={
                      !titlePromptContent ||
                      updateTitlePromptMutation.isPending ||
                      isLoadingTitlePrompt
                    }
                  >
                    <Copy size={16} /> Copy
                  </button>
                  <button
                    onClick={() =>
                      setIsEditingTitlePrompt(!isEditingTitlePrompt)
                    }
                    className="text-brand-purple hover:text-brand-purple/80 flex items-center gap-1 bg-gray-700 py-1.5 px-3 rounded-md text-sm"
                    disabled={
                      isLoadingTitlePrompt ||
                      updateTitlePromptMutation.isPending
                    }
                  >
                    {isEditingTitlePrompt ? "Cancel" : "Edit"}
                  </button>
                </div>
              </div>
              {isLoadingTitlePrompt ? (
                <p className="text-brand-muted">Loading title prompt...</p>
              ) : titlePromptError ? (
                <p className="text-red-400">Error loading title prompt.</p>
              ) : (
                <form onSubmit={handleUpdateTitlePrompt} className="space-y-4">
                  <div>
                    <label
                      htmlFor="titlePromptContent"
                      className="block text-sm font-medium text-brand-light mb-1"
                    >
                      Prompt Content:
                    </label>
                    <textarea
                      id="titlePromptContent"
                      value={titlePromptContent}
                      onChange={(e) => setTitlePromptContent(e.target.value)}
                      className="w-full p-3 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-purple resize-y"
                      rows={8}
                      disabled={
                        !isEditingTitlePrompt ||
                        updateTitlePromptMutation.isPending
                      }
                      placeholder="Enter the AI title generation prompt. Explain how to create a unique, plain-text title."
                    />
                    <p className="text-xs text-brand-muted mt-1">
                      This prompt guides the AI in generating a unique,
                      plain-text article title.
                    </p>
                  </div>
                  <div>
                    <label
                      htmlFor="titlePromptDescription"
                      className="block text-sm font-medium text-brand-light mb-1"
                    >
                      Description (Optional):
                    </label>
                    <input
                      id="titlePromptDescription"
                      type="text"
                      value={titlePromptDescription}
                      onChange={(e) =>
                        setTitlePromptDescription(e.target.value)
                      }
                      className="w-full p-3 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-purple"
                      disabled={
                        !isEditingTitlePrompt ||
                        updateTitlePromptMutation.isPending
                      }
                      placeholder="Describe the purpose of this title prompt (e.g., 'Aggressive SEO titles')"
                    />
                  </div>
                  {isEditingTitlePrompt && (
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        className="bg-brand-purple text-white font-bold py-2 px-4 rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        disabled={updateTitlePromptMutation.isPending}
                      >
                        {updateTitlePromptMutation.isPending ? (
                          <Loader2 size={18} className="animate-spin" />
                        ) : (
                          <CheckCircle size={18} />
                        )}
                        {updateTitlePromptMutation.isPending
                          ? "Saving..."
                          : "Save Title Prompt"}
                      </button>
                    </div>
                  )}
                </form>
              )}
            </div>

            {/* Content Prompt Subsection */}
            <div className="mb-8 border border-gray-700 rounded-lg p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-white">
                  Content Generation Prompt
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => copyPromptToClipboard(contentPromptContent)}
                    className="text-brand-light hover:text-white flex items-center gap-1 bg-gray-700 py-1.5 px-3 rounded-md text-sm"
                    disabled={
                      !contentPromptContent ||
                      updateContentPromptMutation.isPending ||
                      isLoadingContentPrompt
                    }
                  >
                    <Copy size={16} /> Copy
                  </button>
                  <button
                    onClick={() =>
                      setIsEditingContentPrompt(!isEditingContentPrompt)
                    }
                    className="text-brand-purple hover:text-brand-purple/80 flex items-center gap-1 bg-gray-700 py-1.5 px-3 rounded-md text-sm"
                    disabled={
                      isLoadingContentPrompt ||
                      updateContentPromptMutation.isPending
                    }
                  >
                    {isEditingContentPrompt ? "Cancel" : "Edit"}
                  </button>
                </div>
              </div>
              {isLoadingContentPrompt ? (
                <p className="text-brand-muted">Loading content prompt...</p>
              ) : contentPromptError ? (
                <p className="text-red-400">Error loading content prompt.</p>
              ) : (
                <form
                  onSubmit={handleUpdateContentPrompt}
                  className="space-y-4"
                >
                  <div>
                    <label
                      htmlFor="contentPromptContent"
                      className="block text-sm font-medium text-brand-light mb-1"
                    >
                      Prompt Content:
                    </label>
                    <textarea
                      id="contentPromptContent"
                      value={contentPromptContent}
                      onChange={(e) => setContentPromptContent(e.target.value)}
                      className="w-full p-3 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-purple resize-y"
                      rows={8}
                      disabled={
                        !isEditingContentPrompt ||
                        updateContentPromptMutation.isPending
                      }
                      placeholder="Enter the AI content generation prompt. Explain how to create expanded, humanized HTML content."
                    />
                    <p className="text-xs text-brand-muted mt-1">
                      This prompt guides the AI in generating humanized HTML
                      article content.
                    </p>
                  </div>
                  <div>
                    <label
                      htmlFor="contentPromptDescription"
                      className="block text-sm font-medium text-brand-light mb-1"
                    >
                      Description (Optional):
                    </label>
                    <input
                      id="contentPromptDescription"
                      type="text"
                      value={contentPromptDescription}
                      onChange={(e) =>
                        setContentPromptDescription(e.target.value)
                      }
                      className="w-full p-3 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-purple"
                      disabled={
                        !isEditingContentPrompt ||
                        updateContentPromptMutation.isPending
                      }
                      placeholder="Describe the purpose of this content prompt (e.g., 'Detailed analysis with examples')"
                    />
                  </div>
                  {isEditingContentPrompt && (
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        className="bg-brand-purple text-white font-bold py-2 px-4 rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        disabled={updateContentPromptMutation.isPending}
                      >
                        {updateContentPromptMutation.isPending ? (
                          <Loader2 size={18} className="animate-spin" />
                        ) : (
                          <CheckCircle size={18} />
                        )}
                        {updateContentPromptMutation.isPending
                          ? "Saving..."
                          : "Save Content Prompt"}
                      </button>
                    </div>
                  )}
                </form>
              )}
            </div>

            {/* --- NEW: Prediction Prompt Subsection --- */}
            <div className="border border-gray-700 rounded-lg p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-white">
                  Prediction Content Prompt
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      copyPromptToClipboard(predictionPromptContent)
                    }
                    className="text-brand-light hover:text-white flex items-center gap-1 bg-gray-700 py-1.5 px-3 rounded-md text-sm"
                    disabled={
                      !predictionPromptContent ||
                      updatePredictionPromptMutation.isPending ||
                      isLoadingPredictionPrompt
                    }
                  >
                    <Copy size={16} /> Copy
                  </button>
                  <button
                    onClick={() =>
                      setIsEditingPredictionPrompt(!isEditingPredictionPrompt)
                    }
                    className="text-brand-purple hover:text-brand-purple/80 flex items-center gap-1 bg-gray-700 py-1.5 px-3 rounded-md text-sm"
                    disabled={
                      isLoadingPredictionPrompt ||
                      updatePredictionPromptMutation.isPending
                    }
                  >
                    {isEditingPredictionPrompt ? "Cancel" : "Edit"}
                  </button>
                </div>
              </div>
              {isLoadingPredictionPrompt ? (
                <p className="text-brand-muted">Loading prediction prompt...</p>
              ) : predictionPromptError ? (
                <p className="text-red-400">Error loading prediction prompt.</p>
              ) : (
                <form
                  onSubmit={handleUpdatePredictionPrompt}
                  className="space-y-4"
                >
                  <div>
                    <label
                      htmlFor="predictionPromptContent"
                      className="block text-sm font-medium text-brand-light mb-1"
                    >
                      Prompt Content:
                    </label>
                    <textarea
                      id="predictionPromptContent"
                      value={predictionPromptContent}
                      onChange={(e) =>
                        setPredictionPromptContent(e.target.value)
                      }
                      className="w-full p-3 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-purple resize-y"
                      rows={8}
                      disabled={
                        !isEditingPredictionPrompt ||
                        updatePredictionPromptMutation.isPending
                      }
                      placeholder="Enter the AI prediction generation prompt. Explain how to create a detailed match prediction based on provided data."
                    />
                    <p className="text-xs text-brand-muted mt-1">
                      This prompt guides the AI in generating a detailed match
                      prediction article based on fixture data, statistics, and
                      the predicted outcome.
                    </p>
                  </div>
                  <div>
                    <label
                      htmlFor="predictionPromptDescription"
                      className="block text-sm font-medium text-brand-light mb-1"
                    >
                      Description (Optional):
                    </label>
                    <input
                      id="predictionPromptDescription"
                      type="text"
                      value={predictionPromptDescription}
                      onChange={(e) =>
                        setPredictionPromptDescription(e.target.value)
                      }
                      className="w-full p-3 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-purple"
                      disabled={
                        !isEditingPredictionPrompt ||
                        updatePredictionPromptMutation.isPending
                      }
                      placeholder="Describe the purpose of this prediction prompt (e.g., 'In-depth match preview and betting tips')"
                    />
                  </div>
                  {isEditingPredictionPrompt && (
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        className="bg-brand-purple text-white font-bold py-2 px-4 rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        disabled={updatePredictionPromptMutation.isPending}
                      >
                        {updatePredictionPromptMutation.isPending ? (
                          <Loader2 size={18} className="animate-spin" />
                        ) : (
                          <CheckCircle size={18} />
                        )}
                        {updatePredictionPromptMutation.isPending
                          ? "Saving..."
                          : "Save Prediction Prompt"}
                      </button>
                    </div>
                  )}
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === "external_news" && (
        <div className="space-y-8">
          {/* --- FETCH EXTERNAL NEWS SECTION --- */}
          <div className="bg-brand-secondary p-6 rounded-lg shadow-xl">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2 mb-4">
              <DownloadCloud size={24} /> Fetch News from Newsdata.io
            </h2>
            <form
              onSubmit={handleFetchNews}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              <div>
                <label
                  htmlFor="newsQuery"
                  className="block text-sm font-medium text-brand-light mb-1"
                >
                  Keywords (qInTitle):
                </label>
                <input
                  type="text"
                  id="newsQuery"
                  value={newsQuery}
                  onChange={(e) => setNewsQuery(e.target.value)}
                  className="w-full p-3 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-purple"
                  placeholder="e.g., 'football OR soccer' (searches in title)"
                />
                <p className="text-xs text-brand-muted mt-1">
                  Keywords to search for in article titles. Use OR for multiple
                  terms.
                </p>
              </div>
              <div>
                <label
                  htmlFor="newsLanguage"
                  className="block text-sm font-medium text-brand-light mb-1"
                >
                  Language:
                </label>
                <select
                  id="newsLanguage"
                  value={newsLanguage}
                  onChange={(e) => setNewsLanguage(e.target.value)}
                  className="w-full p-3 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-purple"
                >
                  <option value="en">English</option>
                  <option value="tr">Turkish</option>
                  {/* Add more languages as supported by newsdata.io */}
                </select>
              </div>
              <div>
                <label
                  htmlFor="newsCountry"
                  className="block text-sm font-medium text-brand-light mb-1"
                >
                  Countries (Multi-select):
                </label>
                <select
                  id="newsCountry"
                  multiple
                  value={newsCountry}
                  onChange={handleCountryChange}
                  className="w-full p-3 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-purple h-28"
                >
                  {availableCountries.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-brand-muted mt-1">
                  Select one or more countries for news sources.
                </p>
              </div>
              <div>
                <label
                  htmlFor="newsCategory"
                  className="block text-sm font-medium text-brand-light mb-1"
                >
                  Categories (Multi-select):
                </label>
                <select
                  id="newsCategory"
                  multiple
                  value={newsCategory}
                  onChange={handleCategoryChange}
                  className="w-full p-3 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-purple h-28"
                >
                  {availableCategories.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-brand-muted mt-1">
                  Select one or more categories for news sources.
                </p>
              </div>
              <div className="md:col-span-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => refetchExternalNews()}
                  className="flex items-center gap-2 bg-gray-600 text-white font-bold py-2 px-4 rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={
                    isLoadingNews ||
                    fetchNewsMutation.isPending ||
                    processArticleMutation.isPending
                  }
                >
                  <RefreshCw
                    size={18}
                    className={isLoadingNews ? "animate-spin" : ""}
                  />
                  Refresh List
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 bg-brand-purple text-white font-bold py-2 px-4 rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={fetchNewsMutation.isPending}
                >
                  {fetchNewsMutation.isPending ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    <DownloadCloud size={20} />
                  )}
                  {fetchNewsMutation.isPending
                    ? "Fetching..."
                    : "Fetch New Articles"}
                </button>
              </div>
            </form>
          </div>

          {/* --- EXTERNAL NEWS ARTICLES LIST --- */}
          <div className="bg-brand-secondary rounded-lg overflow-hidden shadow-xl">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2 mb-4">
                <Newspaper size={24} /> External News Articles
              </h2>
              <div className="flex items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-4">
                  <span className="text-brand-light text-sm">
                    Filter by Status:
                  </span>
                  <select
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="p-2 rounded bg-gray-700 text-white border border-gray-600 text-sm"
                  >
                    <option value="fetched">Fetched (Ready to Process)</option>
                    <option value="processed">Processed</option>
                    <option value="skipped">Skipped</option>
                    <option value="error">Error</option>
                    <option value="">All</option>
                  </select>
                </div>
                {/* --- AI Journalist Dropdown --- */}
                <div className="flex items-center gap-2">
                  <User size={18} className="text-brand-muted" />
                  <select
                    value={selectedJournalistId || ""}
                    onChange={(e) =>
                      setSelectedJournalistId(e.target.value || null)
                    }
                    className="p-2 rounded bg-gray-700 text-white border border-gray-600 text-sm"
                    disabled={isLoadingJournalists}
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
                  Total Articles: {externalNewsData?.totalCount ?? 0}
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-brand-light">
                <thead className="bg-gray-800/50 text-sm text-brand-muted uppercase">
                  <tr>
                    <th className="p-4">Preview</th>
                    <th className="p-4">Title</th>
                    <th className="p-4">Source</th>
                    <th className="p-4">Published Date</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoadingNews ? (
                    Array.from({ length: articlesPerPage }).map((_, i) => (
                      <tr
                        key={i}
                        className="border-t border-gray-700/50 animate-pulse"
                      >
                        <td className="p-4">
                          <div className="w-20 h-10 bg-gray-700 rounded"></div>
                        </td>
                        <td className="p-4">
                          <div className="h-4 bg-gray-700 rounded w-4/5"></div>
                        </td>
                        <td className="p-4">
                          <div className="h-4 bg-gray-700 rounded w-1/2"></div>
                        </td>
                        <td className="p-4">
                          <div className="h-4 bg-gray-700 rounded w-1/3"></div>
                        </td>
                        <td className="p-4 flex gap-2">
                          <div className="w-8 h-8 bg-gray-700 rounded-full"></div>
                          <div className="w-8 h-8 bg-gray-700 rounded-full"></div>
                        </td>
                      </tr>
                    ))
                  ) : externalNewsData?.articles?.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="p-8 text-center text-brand-muted"
                      >
                        No external articles found with the current filter. Try
                        fetching new ones!
                      </td>
                    </tr>
                  ) : (
                    externalNewsData?.articles?.map((article) => (
                      <tr
                        key={article._id}
                        className={`border-t border-gray-700/50 transition-colors
                                ${
                                  processingArticleId === article.articleId ||
                                  deletingArticleId === article.articleId
                                    ? "bg-brand-dark/50 animate-pulse"
                                    : "hover:bg-gray-800"
                                }`}
                      >
                        <td className="p-4">
                          {article.imageUrl ? (
                            <Image
                              src={article.imageUrl}
                              alt={article.title}
                              width={80}
                              height={45}
                              objectFit="cover"
                              className="rounded-md"
                            />
                          ) : (
                            <div className="w-20 h-10 bg-gray-700 flex items-center justify-center text-xs text-brand-muted rounded-md">
                              No Image
                            </div>
                          )}
                        </td>
                        <td
                          className="p-4 font-medium max-w-xs overflow-hidden text-ellipsis whitespace-nowrap"
                          title={article.title}
                        >
                          {article.title}
                        </td>
                        <td className="p-4 text-brand-muted">
                          {article.link ? (
                            <a
                              href={article.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:text-white flex items-center gap-1 text-sm"
                            >
                              {article.link.split("/")[2].replace("www.", "")}{" "}
                              <ExternalLink size={14} />
                            </a>
                          ) : (
                            "N/A"
                          )}
                        </td>
                        <td className="p-4 text-brand-muted text-sm">
                          {format(
                            parseISO(article.pubDate),
                            "dd MMM yyyy HH:mm"
                          )}
                        </td>
                        <td className="p-4">
                          <span
                            className={`px-2 py-1 text-xs font-semibold rounded-full min-w-[75px] inline-flex justify-center items-center gap-1
                          ${
                            article.status === "processed"
                              ? "bg-green-500/20 text-green-400"
                              : article.status === "fetched"
                              ? "bg-blue-500/20 text-blue-400"
                              : article.status === "skipped"
                              ? "bg-yellow-500/20 text-yellow-400"
                              : "bg-red-500/20 text-red-400"
                          }`}
                          >
                            {processingArticleId === article.articleId ? (
                              <Loader2 size={12} className="animate-spin" />
                            ) : deletingArticleId === article.articleId ? (
                              <Hourglass size={12} className="animate-spin" />
                            ) : article.status === "processed" ? (
                              <CheckCircle size={12} />
                            ) : article.status === "error" ? (
                              <XCircle size={12} />
                            ) : null}
                            {article.status.charAt(0).toUpperCase() +
                              article.status.slice(1)}
                          </span>
                        </td>
                        <td className="p-4 flex gap-2 items-center h-full">
                          <a
                            href={article.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-brand-muted hover:text-white p-1 rounded-full bg-brand-dark"
                            title="View Original Article"
                          >
                            <ExternalLink size={18} />
                          </a>
                          {article.status === "fetched" && (
                            <button
                              onClick={() =>
                                handleProcessArticle(article.articleId)
                              }
                              className="text-brand-purple hover:text-brand-purple/80 p-1 rounded-full bg-brand-dark"
                              title="Process with AI"
                              disabled={
                                processArticleMutation.isPending ||
                                deletingArticleId === article.articleId ||
                                !selectedJournalistId
                              } // Disable if no journalist selected
                            >
                              {processingArticleId === article.articleId ? (
                                <Loader2 size={18} className="animate-spin" />
                              ) : (
                                <Sparkles size={18} />
                              )}
                            </button>
                          )}
                          {article.status === "processed" &&
                            article.processedPostId && (
                              <Link
                                href={`/admin/news/edit/${article.processedPostId}`}
                                className="text-blue-400 hover:text-blue-300 p-1 rounded-full bg-brand-dark"
                                title="View Processed Post"
                              >
                                <ExternalLink size={18} />
                              </Link>
                            )}
                          {(article.status === "error" ||
                            article.status === "skipped") && (
                            <button
                              onClick={() =>
                                handleProcessArticle(article.articleId)
                              } // Allow reprocessing
                              className="text-yellow-400 hover:text-yellow-300 p-1 rounded-full bg-brand-dark"
                              title="Retry Processing"
                              disabled={
                                processArticleMutation.isPending ||
                                deletingArticleId === article.articleId ||
                                !selectedJournalistId
                              } // Disable if no journalist selected
                            >
                              {processingArticleId === article.articleId ? (
                                <Loader2 size={18} className="animate-spin" />
                              ) : (
                                <RefreshCw size={18} />
                              )}
                            </button>
                          )}
                          <button
                            onClick={() =>
                              handleDeleteArticle(article.articleId)
                            }
                            className="text-red-400 hover:text-red-300 p-1 rounded-full bg-brand-dark"
                            title="Delete External Article"
                            disabled={
                              deleteArticleMutation.isPending ||
                              processingArticleId === article.articleId
                            }
                          >
                            {deletingArticleId === article.articleId ? (
                              <Loader2 size={18} className="animate-spin" />
                            ) : (
                              <Trash2 size={18} />
                            )}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {externalNewsData && externalNewsData.articles.length > 0 && (
              <div className="p-6">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "prediction_generation" && <PredictionGenerationTab />}
    </div>
  );
}
