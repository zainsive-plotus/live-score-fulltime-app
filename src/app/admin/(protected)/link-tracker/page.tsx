// ===== src/app/admin/(protected)/link-tracker/page.tsx =====

"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import toast from "react-hot-toast";
import { ITrackedLink } from "@/models/TrackedLink";
import { format } from "date-fns";
import {
  Link as LinkIcon,
  PlusCircle,
  Edit,
  Trash2,
  Copy,
  ExternalLink,
  BarChart2,
  Loader2,
  CheckCircle,
  XCircle,
} from "lucide-react";
import AdminPagination from "@/components/admin/AdminPagination";
import LinkTrackerFormModal from "@/components/admin/LinkTrackerFormModal";
import { useRouter } from "next/navigation"; // ADDED: Import useRouter

interface PaginatedLinksResponse {
  links: ITrackedLink[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
  };
}

const fetchTrackedLinks = async (
  page: number
): Promise<PaginatedLinksResponse> => {
  const { data } = await axios.get(`/api/admin/tracked-links?page=${page}`);
  return data;
};

export default function AdminLinkTrackerPage() {
  const queryClient = useQueryClient();
  const router = useRouter(); // ADDED: Initialize router
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<ITrackedLink | null>(null);

  const {
    data: linksData,
    isLoading,
    isError,
  } = useQuery<PaginatedLinksResponse>({
    queryKey: ["trackedLinks", currentPage],
    queryFn: () => fetchTrackedLinks(currentPage),
    keepPreviousData: true,
  });

  const deleteMutation = useMutation({
    mutationFn: (linkId: string) =>
      axios.delete(`/api/admin/tracked-links/${linkId}`),
    onSuccess: () => {
      toast.success("Link deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ["trackedLinks"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Failed to delete link.");
    },
  });

  const handleOpenCreateModal = () => {
    setEditingLink(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (link: ITrackedLink) => {
    setEditingLink(link);
    setIsModalOpen(true);
  };

  const handleDelete = (link: ITrackedLink) => {
    if (
      window.confirm(
        `Are you sure you want to delete the link for "${link.description}"? This action cannot be undone.`
      )
    ) {
      deleteMutation.mutate(link._id);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Short link copied to clipboard!");
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white flex items-center gap-2">
          <LinkIcon size={28} /> Link Tracker
        </h1>
        <button
          onClick={handleOpenCreateModal}
          className="flex items-center gap-2 bg-brand-purple text-white font-bold py-2 px-4 rounded-lg hover:opacity-90"
        >
          <PlusCircle size={20} />
          <span>New Link</span>
        </button>
      </div>

      <div className="bg-brand-secondary rounded-lg overflow-x-auto">
        <table className="w-full text-left text-brand-light">
          <thead className="bg-gray-800/50 text-sm text-brand-muted uppercase">
            <tr>
              <th className="p-4">Description</th>
              <th className="p-4">Short Link</th>
              <th className="p-4">Destination</th>
              <th className="p-4 text-center">Clicks</th>
              <th className="p-4 text-center">Status</th>
              <th className="p-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-brand-muted">
                  Loading links...
                </td>
              </tr>
            ) : isError ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-red-400">
                  Failed to load links.
                </td>
              </tr>
            ) : (
              linksData?.links.map((link) => (
                <tr key={link._id} className="border-t border-gray-700/50">
                  <td className="p-4 font-medium">
                    <p className="text-white">{link.description}</p>
                    <p className="text-xs text-brand-muted">
                      Created: {format(new Date(link.createdAt), "dd MMM yyyy")}
                    </p>
                  </td>
                  <td className="p-4 font-mono text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-brand-purple">
                        {link.fullShortLink.replace(/^https?:\/\//, "")}
                      </span>
                      <button
                        onClick={() => copyToClipboard(link.fullShortLink)}
                        className="text-brand-muted hover:text-white"
                        title="Copy link"
                      >
                        <Copy size={16} />
                      </button>
                    </div>
                  </td>
                  <td className="p-4 text-sm max-w-xs truncate">
                    <a
                      href={link.originalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:underline flex items-center gap-1.5"
                      title={link.originalUrl}
                    >
                      {link.originalUrl}
                      <ExternalLink size={14} />
                    </a>
                  </td>
                  <td className="p-4 text-center text-lg font-bold">
                    {link.clickCount}
                  </td>
                  <td className="p-4 text-center">
                    <span
                      className={`p-2 rounded-full ${
                        link.isActive ? "text-green-400" : "text-red-400"
                      }`}
                      title={link.isActive ? "Active" : "Inactive"}
                    >
                      {link.isActive ? (
                        <CheckCircle size={20} />
                      ) : (
                        <XCircle size={20} />
                      )}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex justify-center gap-2">
                      {/* MODIFIED: Button is now enabled and navigates to the stats page */}
                      <button
                        onClick={() =>
                          router.push(`/admin/link-tracker/${link._id}`)
                        }
                        className="text-brand-muted hover:text-white"
                        title="View Stats"
                      >
                        <BarChart2 size={18} />
                      </button>
                      <button
                        onClick={() => handleOpenEditModal(link)}
                        className="text-brand-muted hover:text-white"
                        title="Edit"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(link)}
                        className="text-brand-muted hover:text-red-400"
                        title="Delete"
                        disabled={
                          deleteMutation.isPending &&
                          deleteMutation.variables === link._id
                        }
                      >
                        {deleteMutation.isPending &&
                        deleteMutation.variables === link._id ? (
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
        {linksData?.links.length === 0 && (
          <p className="text-center p-8 text-brand-muted">
            No links created yet. Click "New Link" to get started.
          </p>
        )}
      </div>

      {linksData && linksData.pagination.totalPages > 1 && (
        <div className="mt-6">
          <AdminPagination
            currentPage={currentPage}
            totalPages={linksData.pagination.totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      )}

      <LinkTrackerFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        link={editingLink}
      />
    </div>
  );
}
