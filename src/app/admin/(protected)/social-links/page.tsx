// ===== src/app/admin/(protected)/social-links/page.tsx =====

"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import toast from "react-hot-toast";
import { ISocialLink } from "@/models/SocialLink";
import {
  Share2,
  PlusCircle,
  Edit,
  Trash2,
  ExternalLink,
  CheckCircle,
  XCircle,
  Loader2,
  Twitter,
  Facebook,
  Instagram,
  Youtube,
  Linkedin,
  Send,
  MessageCircle,
} from "lucide-react";
import SocialLinkFormModal from "@/components/admin/SocialLinkFormModal"; // MODIFIED: Uncommented the import

const platformIcons: { [key: string]: React.ElementType } = {
  twitter: Twitter,
  facebook: Facebook,
  instagram: Instagram,
  youtube: Youtube,
  linkedin: Linkedin,
  telegram: Send,
  discord: MessageCircle,
};

const fetchSocialLinks = async (): Promise<ISocialLink[]> => {
  const { data } = await axios.get("/api/admin/social-links");
  return data;
};

export default function AdminSocialLinksPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<ISocialLink | null>(null);

  const {
    data: links,
    isLoading,
    isError,
  } = useQuery<ISocialLink[]>({
    queryKey: ["adminSocialLinks"],
    queryFn: fetchSocialLinks,
  });

  const deleteMutation = useMutation({
    mutationFn: (linkId: string) =>
      axios.delete(`/api/admin/social-links/${linkId}`),
    onSuccess: () => {
      toast.success("Social link deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ["adminSocialLinks"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Failed to delete link.");
    },
  });

  const handleOpenCreateModal = () => {
    setEditingLink(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (link: ISocialLink) => {
    setEditingLink(link);
    setIsModalOpen(true);
  };

  const handleDelete = (link: ISocialLink) => {
    if (
      window.confirm(
        `Are you sure you want to delete the ${link.platform} link?`
      )
    ) {
      deleteMutation.mutate(link._id);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white flex items-center gap-2">
          <Share2 size={28} /> Social Links
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
              <th className="p-4">Platform</th>
              <th className="p-4">URL</th>
              <th className="p-4 text-center">Order</th>
              <th className="p-4 text-center">Status</th>
              <th className="p-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-brand-muted">
                  Loading links...
                </td>
              </tr>
            ) : isError ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-red-400">
                  Failed to load links.
                </td>
              </tr>
            ) : (
              links?.map((link) => {
                const Icon = platformIcons[link.platform] || Share2;
                return (
                  <tr key={link._id} className="border-t border-gray-700/50">
                    <td className="p-4 font-medium">
                      <div className="flex items-center gap-3">
                        <Icon size={20} />
                        <span className="capitalize">{link.platform}</span>
                      </div>
                    </td>
                    <td className="p-4 text-sm max-w-xs truncate">
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:underline flex items-center gap-1.5"
                        title={link.url}
                      >
                        <span className="truncate">{link.url}</span>
                        <ExternalLink size={14} />
                      </a>
                    </td>
                    <td className="p-4 text-center font-bold">{link.order}</td>
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
                      <div className="flex justify-center gap-3">
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
                );
              })
            )}
          </tbody>
        </table>
        {links?.length === 0 && !isLoading && (
          <p className="text-center p-8 text-brand-muted">
            No social links configured yet. Click "New Link" to get started.
          </p>
        )}
      </div>

      {/* MODIFIED: The modal is now active and passed the correct props */}
      <SocialLinkFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        link={editingLink}
      />
    </div>
  );
}
