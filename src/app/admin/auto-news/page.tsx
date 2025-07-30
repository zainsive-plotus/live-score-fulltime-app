// ===== src/app/admin/auto-news/page.tsx =====

"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import toast from "react-hot-toast";
import {
  DownloadCloud,
  Sparkles,
  RefreshCw,
  Trash2,
  ExternalLink,
  Loader2,
  CheckCircle,
  XCircle,
  FileText,
  SkipForward,
  Bot,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import Image from "next/image";
import Link from "next/link";
import AdminPagination from "@/components/admin/AdminPagination";
import PredictionGenerationTab from "./PredictionGenerationTab";
import { proxyImageUrl } from "@/lib/image-proxy";
import BatchProcessModal from "@/components/admin/BatchProcessModal";

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

const ProcessSingleModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  article: IExternalNewsArticle | null;
}> = ({ isOpen, onClose, article }) => {
  const queryClient = useQueryClient();
  const [logs, setLogs] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const logContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  const processArticle = async () => {
    if (!article) return;
    setIsProcessing(true);
    setIsComplete(false);
    setLogs([]);

    const response = await fetch("/api/admin/process-external-news", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ articleId: article.articleId }),
    });

    if (!response.body) {
      toast.error("Streaming not supported or response body is missing.");
      setIsProcessing(false);
      setIsComplete(true);
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
            if (json.log) setLogs((prev) => [...prev, json.log]);
          } catch (e) {}
        }
      });
    }
  };

  useEffect(() => {
    if (isOpen) {
      processArticle().finally(() => {
        setIsProcessing(false);
        setIsComplete(true);
        queryClient.invalidateQueries({ queryKey: ["externalNews"] });
        queryClient.invalidateQueries({ queryKey: ["adminCuratedPosts"] });
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-brand-secondary rounded-lg shadow-xl w-full max-w-2xl overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-gray-700">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            {isProcessing && <Loader2 className="animate-spin" />}
            {isComplete && <CheckCircle className="text-green-400" />}
            Article Processing Log
          </h2>
          <button onClick={onClose} className="text-brand-muted hover:text-white" disabled={isProcessing}>
            <XCircle size={24} />
          </button>
        </div>
        <div className="p-6">
          <p className="text-brand-light mb-4">
            Processing: <strong className="text-white">"{article?.title}"</strong>
          </p>
          <div ref={logContainerRef} className="bg-brand-dark p-4 rounded-lg h-80 overflow-y-auto font-mono text-sm space-y-2 custom-scrollbar">
            {logs.map((log, index) => (
              <div key={index} className="flex items-start gap-2">
                <span className="text-brand-muted">{">"}</span>
                <span className={log.startsWith("✓") ? "text-green-400" : log.startsWith("✗") ? "text-red-400" : "text-brand-light"}>
                  {log}
                </span>
              </div>
            ))}
             {isProcessing && <div className="text-yellow-400 animate-pulse">Processing... please wait, this may take a few minutes.</div>}
             {isComplete && <div className="text-green-400 font-bold mt-2">✓ All tasks complete. You can now close this window.</div>}
          </div>
        </div>
         <div className="p-6 border-t border-gray-700 flex justify-end">
            <button onClick={onClose} className="bg-brand-purple text-white font-bold py-2 px-6 rounded-lg hover:opacity-90 disabled:opacity-50" disabled={isProcessing}>
                Close
            </button>
        </div>
      </div>
    </div>
  );
};

export default function AdminAutoNewsPage() {
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<"external_news" | "prediction_generation">("external_news");
  const [newsQuery, setNewsQuery] = useState("football OR soccer");
  const [newsLanguage, setNewsLanguage] = useState("en");
  const [fetchSummary, setFetchSummary] = useState<any | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [articlesPerPage, setArticlesPerPage] = useState(10);
  const [statusFilter, setStatusFilter] = useState("fetched");
  const [deletingArticleId, setDeletingArticleId] = useState<string | null>(null);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [isSingleProcessModalOpen, setIsSingleProcessModalOpen] = useState(false);
  const [articleToProcess, setArticleToProcess] = useState<IExternalNewsArticle | null>(null);

  const { data: externalNewsData, isLoading: isLoadingNews } =
    useQuery<ExternalNewsResponse>({
      queryKey: ["externalNews", currentPage, articlesPerPage, statusFilter],
      queryFn: () =>
        fetchExternalNews(currentPage, articlesPerPage, statusFilter),
      enabled: activeTab === "external_news",
      refetchInterval: 15000,
    });
    
  const fetchedArticlesCount = useMemo(() => {
    // This query is just to get the count, so we can use a smaller limit.
    const fetchedData = queryClient.getQueryData<ExternalNewsResponse>(["externalNews", 1, 1, "fetched"]);
    return fetchedData?.totalCount ?? 0;
  }, [externalNewsData]);

  const handleOpenProcessSingleModal = (article: IExternalNewsArticle) => {
    setArticleToProcess(article);
    setIsSingleProcessModalOpen(true);
  };

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
      case "processed": return { icon: CheckCircle, color: "text-green-400" };
      case "processing": return { icon: Loader2, color: "text-blue-400 animate-spin" };
      case "fetched": return { icon: DownloadCloud, color: "text-yellow-400" };
      case "skipped": return { icon: SkipForward, color: "text-gray-400" };
      case "error": return { icon: XCircle, color: "text-red-400" };
      default: return { icon: AlertCircle, color: "text-gray-400" };
    }
  };

  return (
    <div>
      <FetchSummaryModal
        summary={fetchSummary}
        onClose={() => setFetchSummary(null)}
      />
      {isBatchModalOpen && (
          <BatchProcessModal 
              isOpen={isBatchModalOpen}
              onClose={() => setIsBatchModalOpen(false)}
          />
      )}
      {isSingleProcessModalOpen && (
        <ProcessSingleModal
          isOpen={isSingleProcessModalOpen}
          onClose={() => setIsSingleProcessModalOpen(false)}
          article={articleToProcess}
        />
      )}

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white flex items-center gap-2">
          <Sparkles size={28} /> Automated Content Engine
        </h1>
      </div>
      <div className="flex border-b border-gray-700 mb-8">
        <button
          onClick={() => setActiveTab("external_news")}
          className={`px-6 py-3 text-lg font-semibold flex items-center gap-2 ${
            activeTab === "external_news"
              ? "text-brand-purple border-b-2 border-brand-purple"
              : "text-brand-muted hover:text-white"
          }`}
        >
          <DownloadCloud size={20} /> Article Automation Log
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

      {activeTab === "external_news" && (
        <div className="space-y-8">
          <div className="bg-brand-secondary p-6 rounded-lg shadow-xl">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2 mb-4">
              <DownloadCloud size={24} /> Fetch New Articles
            </h2>
            <form
              onSubmit={handleFetchNews}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              <div>
                <label htmlFor="newsQuery" className="block text-sm font-medium text-brand-light mb-1">
                  Keywords (qInTitle):
                </label>
                <input type="text" id="newsQuery" value={newsQuery} onChange={(e) => setNewsQuery(e.target.value)}
                  className="w-full p-3 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-purple"
                />
              </div>
              <div>
                <label htmlFor="newsLanguage" className="block text-sm font-medium text-brand-light mb-1">
                  Language:
                </label>
                <select id="newsLanguage" value={newsLanguage} onChange={(e) => setNewsLanguage(e.target.value)}
                  className="w-full p-3 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-purple">
                  <option value="en">English</option>
                  <option value="tr">Turkish</option>
                </select>
              </div>
              <div className="md:col-span-2 flex justify-end">
                <button type="submit" className="flex items-center gap-2 bg-brand-purple text-white font-bold py-2 px-4 rounded-lg hover:opacity-90 disabled:opacity-50" disabled={fetchNewsMutation.isPending}>
                  {fetchNewsMutation.isPending ? (<Loader2 size={20} className="animate-spin" />) : (<DownloadCloud size={20} />)}{" "}
                  {fetchNewsMutation.isPending ? "Fetching..." : "Fetch New Articles"}
                </button>
              </div>
            </form>
          </div>
          <div className="bg-brand-secondary rounded-lg overflow-hidden shadow-xl">
            <div className="p-6">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <FileText size={24} /> Article Processing Queue
                </h2>
                <div className="flex items-center gap-4">
                  <button onClick={() => setIsBatchModalOpen(true)} disabled={fetchedArticlesCount === 0} className="flex items-center gap-2 bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed">
                      <Bot size={18} /> Process All ({fetchedArticlesCount})
                  </button>
                  <select
                    value={statusFilter}
                    onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                    className="p-2 rounded bg-gray-700 text-white border border-gray-600 text-sm">
                    <option value="fetched">Fetched</option>
                    <option value="processing">Processing</option>
                    <option value="processed">Processed</option>
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
                    <th className="p-4">Status</th>
                    <th className="p-4">Fetched At</th>
                    <th className="p-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoadingNews ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i}><td colSpan={5} className="p-4 h-20 animate-pulse"><div className="h-full bg-gray-700 rounded"></div></td></tr>
                    ))
                  ) : externalNewsData?.articles?.length === 0 ? (
                    <tr><td colSpan={5} className="p-8 text-center text-brand-muted">No articles found with this filter.</td></tr>
                  ) : (
                    externalNewsData?.articles.map((article) => {
                      const { icon: StatusIcon, color: statusColor } = statusInfo(article.status);
                      return (
                        <tr key={article._id} className={`border-t border-gray-700/50 transition-colors ${deletingArticleId === article.articleId ? "bg-brand-dark/50 opacity-50" : "hover:bg-gray-800"}`}>
                          <td className="p-4">
                            <Image src={proxyImageUrl(article.imageUrl)} alt={article.title} width={100} height={56} objectFit="cover" className="rounded-md bg-gray-700"/>
                          </td>
                          <td className="p-4 font-medium max-w-sm" title={article.title}>
                            <a href={article.link} target="_blank" rel="noopener noreferrer" className="hover:text-brand-purple transition-colors">
                              {article.title}{" "}<ExternalLink size={12} className="inline-block"/>
                            </a>
                          </td>
                          <td className="p-4">
                            <div className={`flex items-center gap-1.5 font-semibold text-xs ${statusColor}`}>
                              <StatusIcon size={12} />
                              <span className="capitalize">{article.status}</span>
                            </div>
                          </td>
                          <td className="p-4 text-brand-muted text-sm">
                            {format(parseISO(article.pubDate), "dd MMM, HH:mm")}
                          </td>
                          <td className="p-4 flex gap-2 items-center h-full">
                            {article.status === "fetched" && (
                              <button onClick={() => handleOpenProcessSingleModal(article)} className="flex items-center gap-2 bg-brand-purple text-white font-bold py-2 px-3 rounded-lg text-sm hover:opacity-90">
                                <Sparkles size={16} />
                                <span>Generate</span>
                              </button>
                            )}
                            {article.status === "processed" && article.processedPostId && (
                                <Link href={`/admin/curated-news`} className="text-blue-400 hover:text-blue-300 p-2 rounded-full bg-brand-dark" title="View Processed Post">
                                  <ExternalLink size={18} />
                                </Link>
                            )}
                            <button onClick={() => handleDeleteArticle(article.articleId, article.title)} className="text-red-400 hover:text-red-300 p-2 rounded-full bg-brand-dark" title="Delete Article" disabled={deleteArticleMutation.isPending}>
                              {deletingArticleId === article.articleId ? (<Loader2 size={18} className="animate-spin" />) : (<Trash2 size={18} />)}
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
                <AdminPagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage}/>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "prediction_generation" && <PredictionGenerationTab />}
    </div>
  );
}