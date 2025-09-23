// ===== src/app/admin/(protected)/redirects/page.tsx (NEW FILE) =====
"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import toast from "react-hot-toast";
import { IRedirect } from "@/models/Redirect";
import AdminPagination from "@/components/admin/AdminPagination";
import RedirectFormModal from "@/components/admin/redirects/RedirectFormModal";
import {
  PlusCircle,
  Edit,
  Trash2,
  Loader2,
  RefreshCw,
  Send,
  Route,
} from "lucide-react";

interface PaginatedResponse {
  redirects: IRedirect[];
  pagination: { currentPage: number; totalPages: number };
}

const fetchRedirects = async (page: number): Promise<PaginatedResponse> => {
  const { data } = await axios.get(`/api/admin/redirects?page=${page}`);
  return data;
};

export default function AdminRedirectsPage() {
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRedirect, setEditingRedirect] = useState<IRedirect | null>(
    null
  );

  const { data, isLoading } = useQuery<PaginatedResponse>({
    queryKey: ["redirectsAdmin", currentPage],
    queryFn: () => fetchRedirects(currentPage),
    keepPreviousData: true,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => axios.delete(`/api/admin/redirects/${id}`),
    onSuccess: () => {
      toast.success("Redirect deleted!");
      queryClient.invalidateQueries({ queryKey: ["redirectsAdmin"] });
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.error || "Deletion failed."),
  });

  const cacheMutation = useMutation({
    mutationFn: () => axios.delete("/api/admin/redirects/cache"),
    onSuccess: (res) => toast.success(res.data.message),
    onError: (err: any) =>
      toast.error(err.response?.data?.error || "Cache rebuild failed."),
  });

  const indexNowMutation = useMutation({
    mutationFn: (url: string) =>
      axios.post("/api/admin/indexing/submit-now", { urls: [url] }),
    onSuccess: () => toast.success("URL submitted to IndexNow."),
    onError: () => toast.error("IndexNow submission failed."),
  });

  const handleOpenEditModal = (redirect: IRedirect) => {
    setEditingRedirect(redirect);
    setIsModalOpen(true);
  };

  return (
    <div>
      <div className="flex flex-wrap gap-4 justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white flex items-center gap-2">
          <Route size={28} /> URL Redirects
        </h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => cacheMutation.mutate()}
            disabled={cacheMutation.isPending}
            className="flex items-center gap-2 bg-amber-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-amber-700 disabled:opacity-50"
          >
            {cacheMutation.isPending ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <RefreshCw size={20} />
            )}{" "}
            Clear & Rebuild Cache
          </button>
          <button
            onClick={() => {
              setEditingRedirect(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 bg-brand-purple text-white font-bold py-2 px-4 rounded-lg hover:opacity-90"
          >
            <PlusCircle size={20} /> New Redirect
          </button>
        </div>
      </div>

      <div className="bg-brand-secondary rounded-lg overflow-x-auto">
        <table className="w-full text-left text-brand-light">
          <thead className="bg-gray-800/50 text-sm text-brand-muted uppercase">
            <tr>
              <th className="p-4">Source Path(s)</th>
              <th className="p-4">Destination URL</th>
              <th className="p-4 text-center">Type</th>
              <th className="p-4 text-center">Status</th>
              <th className="p-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-brand-muted">
                  Loading redirect rules...
                </td>
              </tr>
            ) : (
              data?.redirects.map((redirect) => (
                <tr key={redirect._id} className="border-t border-gray-700/50">
                  <td className="p-4 font-mono text-xs max-w-sm">
                    {redirect.sourcePaths.map((p) => (
                      <div key={p} className="truncate" title={p}>
                        {p}
                      </div>
                    ))}
                  </td>
                  <td
                    className="p-4 font-mono text-xs text-blue-400 max-w-sm truncate"
                    title={redirect.destinationUrl}
                  >
                    <a
                      href={redirect.destinationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {redirect.destinationUrl}
                    </a>
                  </td>
                  <td className="p-4 text-center font-bold">
                    {redirect.statusCode}
                  </td>
                  <td className="p-4 text-center">
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        redirect.isActive
                          ? "bg-green-500/20 text-green-400"
                          : "bg-red-500/20 text-red-400"
                      }`}
                    >
                      {redirect.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex justify-center gap-2">
                      {redirect.statusCode === 301 && (
                        <button
                          onClick={() =>
                            indexNowMutation.mutate(redirect.destinationUrl)
                          }
                          disabled={indexNowMutation.isPending}
                          className="p-2 text-brand-muted hover:text-white"
                          title="Submit Destination to IndexNow"
                        >
                          {indexNowMutation.isPending &&
                          indexNowMutation.variables ===
                            redirect.destinationUrl ? (
                            <Loader2 size={18} className="animate-spin" />
                          ) : (
                            <Send size={18} />
                          )}
                        </button>
                      )}
                      <button
                        onClick={() => handleOpenEditModal(redirect)}
                        className="p-2 text-brand-muted hover:text-white"
                        title="Edit"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => deleteMutation.mutate(redirect._id)}
                        disabled={
                          deleteMutation.isPending &&
                          deleteMutation.variables === redirect._id
                        }
                        className="p-2 text-brand-muted hover:text-red-400"
                        title="Delete"
                      >
                        {deleteMutation.isPending &&
                        deleteMutation.variables === redirect._id ? (
                          <Loader2 size={18} className="animate-spin" />
                        ) : (
                          <Trash2 size={18} />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {data?.redirects.length === 0 && !isLoading && (
          <p className="text-center p-8 text-brand-muted">
            No redirect rules found.
          </p>
        )}
      </div>

      {data && data.pagination.totalPages > 1 && (
        <div className="mt-6">
          <AdminPagination
            currentPage={currentPage}
            totalPages={data.pagination.totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      )}

      <RedirectFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        redirect={editingRedirect}
      />
    </div>
  );
}
