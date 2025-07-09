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
  User,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import Image from "next/image";
import Link from "next/link";
import Pagination from "@/components/Pagination";
import PredictionGenerationTab from "./PredictionGenerationTab";

// Interfaces and Fetchers (no changes needed)
interface IExternalNewsArticle {
  _id: string;
  articleId: string;
  title: string;
  link: string;
  pubDate: string;
  imageUrl?: string | null;
  status: "fetched" | "processing" | "processed" | "skipped" | "error";
  processedPostId?: string;
  createdAt: string;
  updatedAt: string;
}
interface ExternalNewsResponse {
  articles: IExternalNewsArticle[];
  totalCount: number;
  currentPage: number;
  perPage: number;
}
interface IAIPrompt {
  _id: string;
  name: string;
  prompt: string;
  description?: string;
  type: "title" | "content" | "prediction_content";
}
interface IAIJournalist {
  _id: string;
  name: string;
  description?: string;
  tonePrompt: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
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
const fetchAIPrompt = async (
  name: string,
  type: "title" | "content" | "prediction_content"
): Promise<IAIPrompt> => {
  const { data } = await axios.get(
    `/api/admin/ai-prompt?name=${encodeURIComponent(name)}&type=${type}`
  );
  return data;
};
const fetchAIJournalists = async (): Promise<IAIJournalist[]> => {
  const { data } = await axios.get("/api/admin/ai-journalists");
  return data;
};
const TITLE_PROMPT_NAME = "AI Title Generation";
const CONTENT_PROMPT_NAME = "AI Content Generation";
const PREDICTION_PROMPT_NAME = "AI Prediction Content Generation";
const FetchSummaryModal = ({
  summary,
  onClose,
}: {
  summary: any;
  onClose: () => void;
}) => {
  if (!summary) return null;
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-brand-secondary rounded-lg shadow-xl w-full max-w-md text-center p-8">
        <CheckCircle size={48} className="text-green-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">Fetch Complete!</h2>
        <p className="text-brand-muted mb-6">{summary.message}</p>
        <div className="grid grid-cols-3 gap-4 text-white mb-8">
          <div className="bg-green-500/20 p-4 rounded-lg">
            <p className="text-3xl font-bold">{summary.newArticlesCount}</p>
            <p className="text-sm font-semibold">Saved</p>
          </div>
          <div className="bg-yellow-500/20 p-4 rounded-lg">
            <p className="text-3xl font-bold">{summary.skippedArticlesCount}</p>
            <p className="text-sm font-semibold">Skipped</p>
          </div>
          <div className="bg-red-500/20 p-4 rounded-lg">
            <p className="text-3xl font-bold">
              {summary.failedArticlesCount || 0}
            </p>
            <p className="text-sm font-semibold">Failed</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="bg-brand-purple text-white font-bold py-2 px-6 rounded-lg hover:opacity-90"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default function AdminAutoNewsPage() {
  const queryClient = useQueryClient();

  // All state and query declarations are unchanged
  const [activeTab, setActiveTab] = useState<
    "settings" | "external_news" | "prediction_generation"
  >("settings");
  const [newsQuery, setNewsQuery] = useState("football OR soccer");
  const [newsLanguage, setNewsLanguage] = useState("en");
  const [newsCountry, setNewsCountry] = useState<string[]>(["gb", "us"]);
  const [newsCategory, setNewsCategory] = useState<string[]>(["sports"]);
  const [fetchSummary, setFetchSummary] = useState<any | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [articlesPerPage, setArticlesPerPage] = useState(10);
  const [statusFilter, setStatusFilter] = useState("fetched");
  const [selectedJournalistId, setSelectedJournalistId] = useState<
    string | null
  >(null);
  const [processingArticleId, setProcessingArticleId] = useState<string | null>(
    null
  );
  const [deletingArticleId, setDeletingArticleId] = useState<string | null>(
    null
  );

  const {
    data: externalNewsData,
    isLoading: isLoadingNews,
    refetch: refetchExternalNews,
  } = useQuery<ExternalNewsResponse>({
    queryKey: ["externalNews", currentPage, articlesPerPage, statusFilter],
    queryFn: () =>
      fetchExternalNews(currentPage, articlesPerPage, statusFilter),
    enabled: activeTab === "external_news",
    staleTime: 1000 * 60,
  });

  const { data: journalists, isLoading: isLoadingJournalists } = useQuery<
    IAIJournalist[]
  >({
    queryKey: ["aiJournalists"],
    queryFn: fetchAIJournalists,
  });

  useEffect(() => {
    if (journalists && !selectedJournalistId) {
      const firstActive = journalists.find((j) => j.isActive);
      if (firstActive) setSelectedJournalistId(firstActive._id);
    }
  }, [journalists, selectedJournalistId]);

  const fetchNewsMutation = useMutation({
    mutationFn: (payload: {
      query: string;
      language: string;
      country: string[];
      category: string[];
    }) => axios.post("/api/admin/fetch-external-news", payload),
    onSuccess: (data) => {
      setFetchSummary(data.data);
      queryClient.invalidateQueries({ queryKey: ["externalNews"] });
      setCurrentPage(1);
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.error || "Failed to fetch news."),
  });

  // --- THIS IS THE FIX ---
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
      toast.success(data.data.message || "Article processed!");
      // Invalidate the list on THIS page
      queryClient.invalidateQueries({ queryKey: ["externalNews"] });
      // ALSO invalidate the list on the "Manage News" page
      queryClient.invalidateQueries({ queryKey: ["adminPosts"] });
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.error || "Failed to process article."),
    onSettled: () => setProcessingArticleId(null),
  });

  const deleteArticleMutation = useMutation({
    mutationFn: (articleId: string) => {
      setDeletingArticleId(articleId);
      return axios.delete(`/api/admin/external-news?articleId=${articleId}`);
    },
    onSuccess: () => {
      toast.success("Article deleted!");
      queryClient.invalidateQueries({ queryKey: ["externalNews"] });
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.error || "Failed to delete article."),
    onSettled: () => setDeletingArticleId(null),
  });

  const handleFetchNews = (e: React.FormEvent) => {
    e.preventDefault();
    fetchNewsMutation.mutate({
      query: newsQuery,
      language: newsLanguage,
      country: newsCountry,
      category: newsCategory,
    });
  };
  const handleProcessArticle = (articleId: string) => {
    if (!selectedJournalistId) {
      toast.error("Please select an AI Journalist.");
      return;
    }
    processArticleMutation.mutate({
      articleId,
      sportCategory: "football",
      journalistId: selectedJournalistId,
    });
  };
  const handleDeleteArticle = (articleId: string) => {
    if (window.confirm("Are you sure? This cannot be undone.")) {
      deleteArticleMutation.mutate(articleId);
    }
  };

  const totalPages = externalNewsData
    ? Math.ceil(externalNewsData.totalCount / articlesPerPage)
    : 0;
  const availableCountries = [
    { code: "us", name: "United States" },
    { code: "gb", name: "United Kingdom" },
    { code: "tr", name: "Turkey" },
  ];
  const availableCategories = [
    { code: "sports", name: "Sports" },
    { code: "business", name: "Business" },
    { code: "technology", name: "Technology" },
  ];
  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) =>
    setNewsCountry(
      Array.from(e.target.selectedOptions, (option) => option.value)
    );
  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) =>
    setNewsCategory(
      Array.from(e.target.selectedOptions, (option) => option.value)
    );

  return (
    <div>
      <FetchSummaryModal
        summary={fetchSummary}
        onClose={() => setFetchSummary(null)}
      />
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white flex items-center gap-2">
          <Newspaper size={28} /> Automated News Engine
        </h1>
      </div>
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
          News
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

      {activeTab === "external_news" && (
        <div className="space-y-8">
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
                />
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
              </div>
              <div className="md:col-span-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => refetchExternalNews()}
                  className="flex items-center gap-2 bg-gray-600 text-white font-bold py-2 px-4 rounded-lg hover:opacity-90 disabled:opacity-50"
                  disabled={
                    isLoadingNews ||
                    fetchNewsMutation.isPending ||
                    processArticleMutation.isPending
                  }
                >
                  <RefreshCw
                    size={18}
                    className={isLoadingNews ? "animate-spin" : ""}
                  />{" "}
                  Refresh List
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 bg-brand-purple text-white font-bold py-2 px-4 rounded-lg hover:opacity-90 disabled:opacity-50"
                  disabled={fetchNewsMutation.isPending}
                >
                  {fetchNewsMutation.isPending ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    <DownloadCloud size={20} />
                  )}{" "}
                  {fetchNewsMutation.isPending
                    ? "Fetching..."
                    : "Fetch New Articles"}
                </button>
              </div>
            </form>
          </div>
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
                    <option value="fetched">Fetched</option>
                    <option value="processed">Processed</option>
                    <option value="skipped">Skipped</option>
                    <option value="error">Error</option>
                    <option value="">All</option>
                  </select>
                </div>
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
                        ? "Loading..."
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
                <span className="text-brand-muted text-sm ml-auto">
                  Total: {externalNewsData?.totalCount ?? 0}
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
                        <td className="p-4">
                          <div className="h-4 bg-gray-700 rounded w-1/4"></div>
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
                        No articles found with this filter.
                      </td>
                    </tr>
                  ) : (
                    // --- THIS IS THE FIX: ADDED THE .map() TO RENDER THE ROWS ---
                    externalNewsData?.articles.map((article) => (
                      <tr
                        key={article._id}
                        className={`border-t border-gray-700/50 transition-colors ${
                          processingArticleId === article.articleId ||
                          deletingArticleId === article.articleId
                            ? "bg-brand-dark/50 opacity-50"
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
                            className={`px-2 py-1 text-xs font-semibold rounded-full min-w-[75px] inline-flex justify-center items-center gap-1 ${
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
                            ) : article.status === "processed" ? (
                              <CheckCircle size={12} />
                            ) : null}
                            {article.status.charAt(0).toUpperCase() +
                              article.status.slice(1)}
                          </span>
                        </td>
                        <td className="p-4 flex gap-2 items-center h-full">
                          {article.status === "fetched" && (
                            <button
                              onClick={() =>
                                handleProcessArticle(article.articleId)
                              }
                              className="text-brand-purple hover:text-brand-purple/80 p-1 rounded-full bg-brand-dark"
                              title="Process with AI"
                              disabled={
                                processArticleMutation.isPending ||
                                !!deletingArticleId ||
                                !selectedJournalistId
                              }
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
                          <button
                            onClick={() =>
                              handleDeleteArticle(article.articleId)
                            }
                            className="text-red-400 hover:text-red-300 p-1 rounded-full bg-brand-dark"
                            title="Delete Article"
                            disabled={
                              deleteArticleMutation.isPending ||
                              !!processingArticleId
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
