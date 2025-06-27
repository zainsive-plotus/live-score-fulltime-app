// src/app/admin/banners/page.tsx
"use client";

import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import toast from "react-hot-toast";
import { PlusCircle, Edit, Trash2 } from "lucide-react";
import Image from "next/image";
import { IBanner } from "@/models/Banner";
import BannerFormModal from "@/components/admin/BannerFormModal";
import { AD_SLOTS } from "@/config/adSlots";

const fetchBanners = async (): Promise<IBanner[]> => {
  const { data } = await axios.get("/api/banners");
  return data;
};

export default function AdminBannersPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<IBanner | null>(null);

  // Create a lookup map for user-friendly location names
  const locationNameMap = useMemo(
    () => new Map(AD_SLOTS.map((s) => [s.id, s.name])),
    []
  );

  const {
    data: banners,
    isLoading,
    error,
  } = useQuery<IBanner[]>({
    queryKey: ["adminBanners"],
    queryFn: fetchBanners,
  });

  const deleteMutation = useMutation({
    mutationFn: (bannerId: string) => axios.delete(`/api/banners/${bannerId}`),
    onSuccess: () => {
      toast.success("Banner deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ["adminBanners"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Failed to delete banner.");
    },
  });

  const handleOpenCreateModal = () => {
    setEditingBanner(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (banner: IBanner) => {
    setEditingBanner(banner);
    setIsModalOpen(true);
  };

  const handleDelete = (bannerId: string) => {
    if (
      window.confirm(
        "Are you sure you want to delete this banner? This action cannot be undone."
      )
    ) {
      deleteMutation.mutate(bannerId);
    }
  };

  if (isLoading) return <p className="text-brand-muted">Loading banners...</p>;
  if (error) return <p className="text-red-400">Failed to load banners.</p>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white">Manage Ad Banners</h1>
        <button
          onClick={handleOpenCreateModal}
          className="flex items-center gap-2 bg-brand-purple text-white font-bold py-2 px-4 rounded-lg hover:opacity-90"
        >
          <PlusCircle size={20} />
          <span>New Banner</span>
        </button>
      </div>

      <div className="bg-brand-secondary rounded-lg overflow-x-auto">
        <table className="w-full text-left text-brand-light">
          <thead className="bg-gray-800/50 text-sm text-brand-muted uppercase">
            <tr>
              <th className="p-4">Preview</th>
              <th className="p-4">Title</th>
              <th className="p-4">Location</th> {/* <-- NEW COLUMN */}
              <th className="p-4">Status</th>
              <th className="p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {banners?.map((banner) => (
              <tr
                key={banner._id as string}
                className="border-t border-gray-700/50"
              >
                <td className="p-4">
                  {/* --- THE FIX IS HERE --- */}
                  <Image
                    src={banner.imageUrl}
                    alt={banner.title}
                    width={120}
                    height={60}
                    // Add the objectFit="contain" property here as well.
                    // This was the missing piece from my previous implementation.
                    objectFit="contain"
                    className="rounded-md bg-gray-700"
                  />
                </td>
                <td className="p-4 font-medium">{banner.title}</td>
                <td className="p-4 font-semibold text-brand-light">
                  {locationNameMap.get(banner.location) || banner.location}
                </td>
                <td className="p-4">
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      banner.isActive
                        ? "bg-green-500/20 text-green-400"
                        : "bg-red-500/20 text-red-400"
                    }`}
                  >
                    {banner.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="p-4 flex gap-3 items-center h-full">
                  <button
                    onClick={() => handleOpenEditModal(banner)}
                    className="text-blue-400 hover:text-blue-300"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(banner._id as string)}
                    className="text-red-400 hover:text-red-300"
                  >
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {banners?.length === 0 && (
          <p className="text-center p-8 text-brand-muted">
            No banners found. Click "New Banner" to create one.
          </p>
        )}
      </div>

      <BannerFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        banner={editingBanner}
      />
    </div>
  );
}
