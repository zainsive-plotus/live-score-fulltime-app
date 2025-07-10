// ===== src/app/admin/auto-news/page.tsx =====

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
  Loader2,
  CheckCircle,
  XCircle,
  User,
  FileText,
  SkipForward,
  ChevronDown,
  Lightbulb,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import Image from "next/image";
import Link from "next/link";
import Pagination from "@/components/Pagination";
import PredictionGenerationTab from "./PredictionGenerationTab";
import AIPromptDisplayCard from "@/components/admin/AIPromptDisplayCard";
import { proxyImageUrl } from "@/lib/image-proxy";

// --- Interfaces ---
interface IExternalNewsArticle {
  articleId: string;
  title: string;
  link: string;
  pubDate: string;
  imageUrl?: string | null;
  source_icon?: string | null;
  status: "fetched" | "processing" | "processed" | "skipped" | "error";
  processedPostId?: string;
  _id: string;
}
interface ExternalNewsResponse {
  articles: IExternalNewsArticle[];
  totalCount: number;
  currentPage: number;
  perPage: number;
}
interface IAIJournalist {
  _id: string;
  name: string;
  isActive: boolean;
}

// --- Fetcher Functions ---
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

const fetchAIJournalists = async (): Promise<IAIJournalist[]> => {
  const { data } = await axios.get("/api/admin/ai-journalists");
  return data;
};

// --- FetchSummaryModal Component ---
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

  const [activeTab, setActiveTab] = useState<
    "settings" | "external_news" | "prediction_generation"
  >("settings");
  const [newsQuery, setNewsQuery] = useState("football OR soccer");
  const [newsLanguage, setNewsLanguage] = useState("en");
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

  const { data: externalNewsData, isLoading: isLoadingNews } =
    useQuery<ExternalNewsResponse>({
      queryKey: ["externalNews", currentPage, articlesPerPage, statusFilter],
      queryFn: () =>
        fetchExternalNews(currentPage, articlesPerPage, statusFilter),
      enabled: activeTab === "external_news",
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
    mutationFn: (payload: { query: string; language: string }) =>
      axios.post("/api/admin/fetch-external-news", payload),
    onSuccess: (data) => {
      setFetchSummary(data.data);
      queryClient.invalidateQueries({ queryKey: ["externalNews"] });
      setCurrentPage(1);
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.error || "Failed to fetch news."),
  });

  const processArticleMutation = useMutation({
    mutationFn: (payload: {
      articleId: string;
      journalistId?: string | null;
    }) => {
      setProcessingArticleId(payload.articleId);
      return axios.post("/api/admin/process-external-news", payload);
    },
    onSuccess: (data) => {
      toast.success(data.data.message || "Article processed!");
      queryClient.invalidateQueries({ queryKey: ["externalNews"] });
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
    fetchNewsMutation.mutate({ query: newsQuery, language: newsLanguage });
  };
  const handleProcessArticle = (articleId: string) => {
    if (!selectedJournalistId) {
      toast.error("Please select an AI Journalist.");
      return;
    }
    processArticleMutation.mutate({
      articleId,
      journalistId: selectedJournalistId,
    });
  };
  const handleDeleteArticle = (articleId: string, title: string) => {
    if (window.confirm(`Are you sure you want to delete "${title}"?`)) {
      deleteArticleMutation.mutate(articleId);
    }
  };

  const totalPages = externalNewsData
    ? Math.ceil(externalNewsData.totalCount / articlesPerPage)
    : 0;

  const statusInfo = (
    status: IExternalNewsArticle["status"]
  ): { icon: React.ElementType; color: string } => {
    switch (status) {
      case "processed":
        return { icon: CheckCircle, color: "text-green-400" };
      case "fetched":
        return { icon: DownloadCloud, color: "text-blue-400" };
      case "skipped":
        return { icon: SkipForward, color: "text-yellow-400" };
      case "error":
        return { icon: XCircle, color: "text-red-400" };
      default:
        return { icon: AlertCircle, color: "text-gray-400" };
    }
  };

  return (
    <div>
      <FetchSummaryModal
        summary={fetchSummary}
        onClose={() => setFetchSummary(null)}
      />
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white flex items-center gap-2">
          <Sparkles size={28} /> Automated Content Engine
        </h1>
      </div>
      <div className="flex border-b border-gray-700 mb-8">
        <button
          onClick={() => setActiveTab("settings")}
          className={`px-6 py-3 text-lg font-semibold flex items-center gap-2 ${
            activeTab === "settings"
              ? "text-brand-purple border-b-2 border-brand-purple"
              : "text-brand-muted hover:text-white"
          }`}
        >
          <Settings size={20} /> AI Workflow
        </button>
        <button
          onClick={() => setActiveTab("external_news")}
          className={`px-6 py-3 text-lg font-semibold flex items-center gap-2 ${
            activeTab === "external_news"
              ? "text-brand-purple border-b-2 border-brand-purple"
              : "text-brand-muted hover:text-white"
          }`}
        >
          <DownloadCloud size={20} /> External News
        </button>
        <button
          onClick={() => setActiveTab("prediction_generation")}
          className={`px-6 py-3 text-lg font-semibold flex items-center gap-2 ${
            activeTab === "prediction_generation"
              ? "text-brand-purple border-b-2 border-brand-purple"
              : "text-brand-muted hover:text-white"
          }`}
        >
          <Sparkles size={20} /> Match Predictions
        </button>
      </div>

      {activeTab === "settings" && (
        <div className="max-w-4xl mx-auto space-y-12">
          <section>
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white">
                External News Processing Workflow
              </h2>
              <p className="text-brand-muted mt-2">
                This workflow transforms fetched external news articles into
                unique, high-quality posts on your site.
              </p>
            </div>
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                <span className="font-bold text-brand-purple bg-brand-purple/20 px-2.5 py-1 rounded-full">
                  1
                </span>{" "}
                Title Generation
              </h3>
              <div className="pl-10 space-y-4">
                <div className="bg-brand-dark p-4 rounded-lg border border-gray-700">
                  <p className="text-sm text-brand-light font-medium flex items-center gap-2 mb-2">
                    <Lightbulb size={16} className="text-yellow-400" />
                    How it's used:
                  </p>
                  <p className="text-sm text-brand-muted">
                    The AI uses the original article's title and description to
                    create a completely new, SEO-friendly title in Turkish. It
                    should output **plain text only**.
                  </p>
                  <p className="text-xs text-brand-muted mt-2">
                    Available Placeholders: <code>{`{original_title}`}</code>,{" "}
                    <code>{`{original_description}`}</code>,{" "}
                    <code>{`{journalist_name}`}</code>
                  </p>
                </div>
                <AIPromptDisplayCard
                  promptName="AI Title Generation"
                  promptType="title"
                />
              </div>
            </div>
            <div className="text-center text-brand-muted my-6">
              <ChevronDown size={24} className="mx-auto" />
            </div>
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                <span className="font-bold text-brand-purple bg-brand-purple/20 px-2.5 py-1 rounded-full">
                  2
                </span>{" "}
                Full Content Generation
              </h3>
              <div className="pl-10 space-y-4">
                <div className="bg-brand-dark p-4 rounded-lg border border-gray-700">
                  <p className="text-sm text-brand-light font-medium flex items-center gap-2 mb-2">
                    <Lightbulb size={16} className="text-yellow-400" />
                    How it's used:
                  </p>
                  <p className="text-sm text-brand-muted">
                    The AI takes the **newly generated title** and the original
                    article content, expands upon it, and writes a full article.
                    It should output **pure HTML**.
                  </p>
                  <p className="text-xs text-brand-muted mt-2">
                    Available Placeholders: <code>{`{new_title}`}</code>,{" "}
                    <code>{`{original_content}`}</code>,{" "}
                    <code>{`{journalist_name}`}</code>
                  </p>
                </div>
                <AIPromptDisplayCard
                  promptName="AI Content Generation"
                  promptType="content"
                />
              </div>
            </div>
          </section>

          <hr className="border-gray-700" />

          <section>
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white">
                Match Prediction Workflow
              </h2>
              <p className="text-brand-muted mt-2">
                This workflow generates predictive articles for upcoming matches
                based on statistical data.
              </p>
            </div>
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                <span className="font-bold text-brand-purple bg-brand-purple/20 px-2.5 py-1 rounded-full">
                  1
                </span>{" "}
                Prediction Content Generation
              </h3>
              <div className="pl-10 space-y-4">
                <div className="bg-brand-dark p-4 rounded-lg border border-gray-700">
                  <p className="text-sm text-brand-light font-medium flex items-center gap-2 mb-2">
                    <Lightbulb size={16} className="text-yellow-400" />
                    How it's used:
                  </p>
                  <p className="text-sm text-brand-muted">
                    The AI receives a JSON object with all available fixture
                    data (teams, league, stats, H2H, form) and writes a full
                    preview article in **pure HTML**.
                  </p>
                  <p className="text-xs text-brand-muted mt-2">
                    Available Placeholders: <code>{`{match_data}`}</code> (which
                    contains all fixture info),{" "}
                    <code>{`{journalist_name}`}</code>
                  </p>
                </div>
                <AIPromptDisplayCard
                  promptName="AI Prediction Content Generation"
                  promptType="prediction_content"
                />
              </div>
            </div>
          </section>
        </div>
      )}

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
              <div className="md:col-span-2 flex justify-end">
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
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <FileText size={24} /> Review & Process Articles
                </h2>
                <div className="flex items-center gap-4">
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
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-brand-light">
                <thead className="bg-gray-800/50 text-sm text-brand-muted uppercase">
                  <tr>
                    <th className="p-4">Preview</th>
                    <th className="p-4">Title</th>
                    <th className="p-4">Source</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Published</th>
                    <th className="p-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoadingNews ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i}>
                        <td colSpan={6} className="p-4 h-20 animate-pulse">
                          <div className="h-full bg-gray-700 rounded"></div>
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
                    externalNewsData?.articles.map((article) => {
                      const { icon: StatusIcon, color: statusColor } =
                        statusInfo(article.status);
                      return (
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
                            <Image
                              src={proxyImageUrl(article.imageUrl)}
                              alt={article.title}
                              width={100}
                              height={56}
                              objectFit="cover"
                              className="rounded-md bg-gray-700"
                            />
                          </td>
                          <td
                            className="p-4 font-medium max-w-sm"
                            title={article.title}
                          >
                            <Link
                              href={article.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:text-brand-purple transition-colors"
                            >
                              {article.title}{" "}
                              <ExternalLink
                                size={12}
                                className="inline-block"
                              />
                            </Link>
                          </td>
                          <td className="p-4 text-sm">
                            <div className="flex items-center gap-2">
                              {article.source_icon && (
                                <Image
                                  src={proxyImageUrl(article.source_icon)}
                                  alt=""
                                  width={16}
                                  height={16}
                                  className="rounded-full"
                                />
                              )}
                              <span className="text-brand-muted">
                                {article.link
                                  ?.split("/")[2]
                                  ?.replace("www.", "")}
                              </span>
                            </div>
                          </td>
                          <td className="p-4">
                            <div
                              className={`flex items-center gap-1.5 font-semibold text-xs ${statusColor}`}
                            >
                              {processingArticleId === article.articleId ? (
                                <Loader2 size={12} className="animate-spin" />
                              ) : (
                                <StatusIcon size={12} />
                              )}
                              <span>
                                {article.status.charAt(0).toUpperCase() +
                                  article.status.slice(1)}
                              </span>
                            </div>
                          </td>
                          <td className="p-4 text-brand-muted text-sm">
                            {format(parseISO(article.pubDate), "dd MMM, HH:mm")}
                          </td>
                          <td className="p-4 flex gap-2 items-center h-full">
                            {article.status === "fetched" && (
                              <button
                                onClick={() =>
                                  handleProcessArticle(article.articleId)
                                }
                                className="flex items-center gap-2 bg-brand-purple text-white font-bold py-2 px-3 rounded-lg text-sm hover:opacity-90 disabled:opacity-50"
                                disabled={
                                  processArticleMutation.isPending ||
                                  !selectedJournalistId
                                }
                              >
                                {processingArticleId === article.articleId ? (
                                  <Loader2 size={16} className="animate-spin" />
                                ) : (
                                  <Sparkles size={16} />
                                )}
                                <span>Generate</span>
                              </button>
                            )}
                            {article.status === "processed" &&
                              article.processedPostId && (
                                <Link
                                  href={`/admin/news/edit/${article.processedPostId}`}
                                  className="text-blue-400 hover:text-blue-300 p-2 rounded-full bg-brand-dark"
                                  title="View Processed Post"
                                >
                                  <ExternalLink size={18} />
                                </Link>
                              )}
                            <button
                              onClick={() =>
                                handleDeleteArticle(
                                  article.articleId,
                                  article.title
                                )
                              }
                              className="text-red-400 hover:text-red-300 p-2 rounded-full bg-brand-dark"
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
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            {totalPages > 0 && (
              <div className="p-6 border-t border-gray-700/50">
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
