// ===== src/app/admin/auto-news/page.tsx =====

"use client";

import { useState, useMemo, useEffect, useRef } from "react";
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
  Tag,
  Type,
  Terminal,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import Image from "next/image";
import Link from "next/link";
import Pagination from "@/components/Pagination";
import PredictionGenerationTab from "./PredictionGenerationTab";
import AIPromptDisplayCard from "@/components/admin/AIPromptDisplayCard";
import { proxyImageUrl } from "@/lib/image-proxy";
import { NewsType, SportsCategory } from "@/models/Post";
import { ITitleTemplate } from "@/models/TitleTemplate"; // Import new model interface

// Interfaces
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

// Data fetching functions
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

const fetchTitleTemplates = async (): Promise<ITitleTemplate[]> => {
  const { data } = await axios.get("/api/admin/title-templates?active=true");
  return data;
};

// Available post options
const availableSportsCategories: { id: SportsCategory; label: string }[] = [
  { id: "football", label: "Football" },
  { id: "basketball", label: "Basketball" },
  { id: "tennis", label: "Tennis" },
  { id: "general", label: "General" },
];

const availableNewsTypes: { id: NewsType; label: string }[] = [
  { id: "news", label: "General News" },
  { id: "highlights", label: "Highlights" },
  { id: "reviews", label: "Match Review" },
  { id: "prediction", label: "Prediction/Analysis" },
];

// --- MODAL COMPONENTS ---

// Fetch Summary Modal (Existing)
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

// Process Article Modal (Final Version)
interface ProcessArticleModalProps {
  isOpen: boolean;
  onClose: () => void;
  article: IExternalNewsArticle | null;
  journalists: IAIJournalist[] | undefined;
}
const ProcessArticleModal: React.FC<ProcessArticleModalProps> = ({
  isOpen,
  onClose,
  article,
  journalists,
}) => {
  const queryClient = useQueryClient();
  const [selectedJournalistId, setSelectedJournalistId] = useState<
    string | null
  >(null);
  const [selectedTitleTemplateId, setSelectedTitleTemplateId] =
    useState<string>("");
  const [selectedCategories, setSelectedCategories] = useState<
    SportsCategory[]
  >(["general"]);
  const [newsType, setNewsType] = useState<NewsType>("news");
  const [publishImmediately, setPublishImmediately] = useState(false);

  const [isProcessing, setIsProcessing] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const logContainerRef = useRef<HTMLDivElement>(null);

  const { data: titleTemplates, isLoading: isLoadingTemplates } = useQuery<
    ITitleTemplate[]
  >({
    queryKey: ["activeTitleTemplates"],
    queryFn: fetchTitleTemplates,
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: isOpen,
  });

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  useEffect(() => {
    if (isOpen) {
      // Reset state when modal opens
      setLogs([]);
      setIsProcessing(false);
      setSelectedCategories(["general"]);
      setNewsType("news");
      setPublishImmediately(false);
      setSelectedTitleTemplateId("");
      if (journalists && !selectedJournalistId) {
        const firstActive = journalists.find((j) => j.isActive);
        if (firstActive) setSelectedJournalistId(firstActive._id);
      }
    }
  }, [isOpen, journalists, selectedJournalistId]);

  const handleCategoryChange = (category: SportsCategory) => {
    setSelectedCategories((prev) => {
      if (prev.includes(category)) {
        return prev.length > 1 ? prev.filter((c) => c !== category) : prev;
      }
      return [...prev, category];
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJournalistId || !article) {
      toast.error("Please select an AI Journalist.");
      return;
    }

    setIsProcessing(true);
    setLogs([]);

    const payload = {
      articleId: article.articleId,
      journalistId: selectedJournalistId,
      titleTemplateId: selectedTitleTemplateId || undefined,
      sportsCategory: selectedCategories,
      newsType: newsType,
      status: publishImmediately ? "published" : "draft",
    };

    const response = await fetch("/api/admin/process-external-news", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.body) {
      toast.error("Streaming not supported or response body is missing.");
      setIsProcessing(false);
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split("\n\n");

      lines.forEach((line) => {
        if (line.startsWith("data:")) {
          try {
            const json = JSON.parse(line.substring(5));
            if (json.log) {
              setLogs((prev) => [...prev, json.log]);
            }
            if (json.event === "SUCCESS") {
              toast.success("Article processed successfully!");
              queryClient.invalidateQueries({ queryKey: ["externalNews"] });
              queryClient.invalidateQueries({ queryKey: ["adminPosts"] });
              setTimeout(() => onClose(), 1500);
            }
            if (json.event === "ERROR") {
              throw new Error(json.data.message);
            }
          } catch (e: any) {
            toast.error(e.message || "An error occurred while processing.");
            console.error("Error parsing stream data:", e);
          }
        }
      });
    }

    setIsProcessing(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-brand-secondary rounded-lg shadow-xl w-full max-w-2xl overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-gray-700">
          <h2 className="text-2xl font-bold text-white">
            Process Article Options
          </h2>
          <button
            onClick={onClose}
            className="text-brand-muted hover:text-white"
            disabled={isProcessing}
          >
            <XCircle size={24} />
          </button>
        </div>

        {isProcessing ? (
          <div className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Loader2 className="animate-spin" /> Generating Article...
            </h3>
            <div
              ref={logContainerRef}
              className="bg-brand-dark p-4 rounded-lg h-96 overflow-y-auto font-mono text-sm text-brand-light space-y-2"
            >
              {logs.map((log, index) => (
                <div key={index} className="flex items-start gap-2">
                  <span className="text-brand-muted">{">"}</span>
                  <span
                    className={
                      log.startsWith("✓")
                        ? "text-green-400"
                        : log.startsWith("✗")
                        ? "text-red-400"
                        : ""
                    }
                  >
                    {log}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="p-6 space-y-6 max-h-[80vh] overflow-y-auto"
          >
            <p className="text-brand-light">
              Configure options for generating the article:{" "}
              <strong className="text-white">"{article?.title}"</strong>
            </p>

            <div>
              <label
                htmlFor="journalist"
                className="block text-sm font-medium text-brand-light mb-2 flex items-center gap-2"
              >
                <User size={16} /> AI Journalist
              </label>
              <select
                id="journalist"
                value={selectedJournalistId || ""}
                onChange={(e) =>
                  setSelectedJournalistId(e.target.value || null)
                }
                className="w-full p-3 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-purple"
                required
              >
                <option value="">Select AI Journalist...</option>
                {journalists
                  ?.filter((j) => j.isActive)
                  .map((j) => (
                    <option key={j._id} value={j._id}>
                      {j.name}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="title-template"
                className="block text-sm font-medium text-brand-light mb-2 flex items-center gap-2"
              >
                <Type size={16} /> Title Template (Optional)
              </label>
              <select
                id="title-template"
                value={selectedTitleTemplateId}
                onChange={(e) => setSelectedTitleTemplateId(e.target.value)}
                className="w-full p-3 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-purple"
                disabled={isLoadingTemplates}
              >
                <option value="">
                  {isLoadingTemplates
                    ? "Loading templates..."
                    : "Default (Dynamic Generation)"}
                </option>
                {titleTemplates?.map((template) => (
                  <option key={template._id} value={template._id}>
                    {template.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-brand-light mb-3 flex items-center gap-2">
                <Tag size={16} /> Sports Categories
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {availableSportsCategories.map((category) => (
                  <div key={category.id} className="flex items-center">
                    <input
                      id={`category-${category.id}`}
                      type="checkbox"
                      checked={selectedCategories.includes(category.id)}
                      onChange={() => handleCategoryChange(category.id)}
                      className="w-4 h-4 text-brand-purple bg-gray-700 border-gray-600 rounded focus:ring-brand-purple"
                    />
                    <label
                      htmlFor={`category-${category.id}`}
                      className="ml-3 text-sm font-medium text-brand-light"
                    >
                      {category.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label
                htmlFor="newsType"
                className="block text-sm font-medium text-brand-light mb-2 flex items-center gap-2"
              >
                <Type size={16} /> News Type
              </label>
              <select
                id="newsType"
                value={newsType}
                onChange={(e) => setNewsType(e.target.value as NewsType)}
                className="w-full p-3 rounded bg-gray-700 text-white border border-gray-600"
              >
                {availableNewsTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center">
              <input
                id="publishImmediately"
                type="checkbox"
                checked={publishImmediately}
                onChange={(e) => setPublishImmediately(e.target.checked)}
                className="w-4 h-4 text-brand-purple bg-gray-700 border-gray-600 rounded focus:ring-brand-purple"
              />
              <label
                htmlFor="publishImmediately"
                className="ml-2 text-sm font-medium text-brand-light"
              >
                Publish immediately (if unchecked, saves as Draft)
              </label>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
              <button
                type="button"
                onClick={onClose}
                className="bg-gray-600 text-white font-bold py-2 px-4 rounded-lg hover:opacity-90"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-brand-purple text-white font-bold py-2 px-4 rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                disabled={!selectedJournalistId}
              >
                <Sparkles size={18} />
                Generate Article
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

// --- MAIN PAGE COMPONENT ---

export default function AdminAutoNewsPage() {
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<
    "settings" | "external_news" | "prediction_generation"
  >("external_news");
  const [newsQuery, setNewsQuery] = useState("football OR soccer");
  const [newsLanguage, setNewsLanguage] = useState("en");
  const [fetchSummary, setFetchSummary] = useState<any | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [articlesPerPage, setArticlesPerPage] = useState(10);
  const [statusFilter, setStatusFilter] = useState("fetched");

  const [isProcessModalOpen, setIsProcessModalOpen] = useState(false);
  const [articleToProcess, setArticleToProcess] =
    useState<IExternalNewsArticle | null>(null);

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

  const { data: journalists } = useQuery<IAIJournalist[]>({
    queryKey: ["aiJournalists"],
    queryFn: fetchAIJournalists,
  });

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

  const handleOpenProcessModal = (article: IExternalNewsArticle) => {
    setArticleToProcess(article);
    setIsProcessModalOpen(true);
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
      <ProcessArticleModal
        isOpen={isProcessModalOpen}
        onClose={() => setIsProcessModalOpen(false)}
        article={articleToProcess}
        journalists={journalists}
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
          {/* Settings tab content remains the same */}
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
                              <StatusIcon size={12} />
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
                                onClick={() => handleOpenProcessModal(article)}
                                className="flex items-center gap-2 bg-brand-purple text-white font-bold py-2 px-3 rounded-lg text-sm hover:opacity-90 disabled:opacity-50"
                              >
                                <Sparkles size={16} />
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
                              disabled={deleteArticleMutation.isPending}
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
