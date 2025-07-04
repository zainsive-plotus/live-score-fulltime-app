// src/app/admin/casino-partners/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import toast from "react-hot-toast";
import {
  PlusCircle,
  Edit,
  Trash2,
  Crown,
  Link as LinkIcon,
  ExternalLink,
  Loader2,
  CheckCircle,
  XCircle,
} from "lucide-react"; // Add Crown icon
import Image from "next/image"; // For partner logos

// Assuming ICasinoPartner interface is defined (or define it here)
interface ICasinoPartner {
  _id: string;
  name: string;
  logoUrl: string;
  redirectUrl: string;
  description?: string;
  isFeatured: boolean;
  isActive: boolean;
  order: number;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

// Reusable form modal for creating/editing Casino Partners
interface CasinoPartnerFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  partner?: ICasinoPartner | null; // Optional: for editing
}

const CasinoPartnerFormModal: React.FC<CasinoPartnerFormModalProps> = ({
  isOpen,
  onClose,
  partner,
}) => {
  const queryClient = useQueryClient();
  const [name, setName] = useState(partner?.name || "");
  const [logoUrl, setLogoUrl] = useState(partner?.logoUrl || "");
  const [redirectUrl, setRedirectUrl] = useState(partner?.redirectUrl || "");
  const [description, setDescription] = useState(partner?.description || "");
  const [isFeatured, setIsFeatured] = useState(partner?.isFeatured ?? false);
  const [isActive, setIsActive] = useState(partner?.isActive ?? true);
  const [order, setOrder] = useState(partner?.order ?? 0);

  useEffect(() => {
    // Reset form fields when partner prop changes (for editing)
    if (partner) {
      setName(partner.name);
      setLogoUrl(partner.logoUrl);
      setRedirectUrl(partner.redirectUrl);
      setDescription(partner.description || "");
      setIsFeatured(partner.isFeatured);
      setIsActive(partner.isActive);
      setOrder(partner.order);
    } else {
      // Clear form for new creation
      setName("");
      setLogoUrl("");
      setRedirectUrl("");
      setDescription("");
      setIsFeatured(false);
      setIsActive(true);
      setOrder(0);
    }
  }, [partner]);

  const createMutation = useMutation({
    mutationFn: (newPartner: Partial<ICasinoPartner>) =>
      axios.post("/api/admin/casino-partners", newPartner),
    onSuccess: () => {
      toast.success("Casino Partner created successfully!");
      queryClient.invalidateQueries({ queryKey: ["casinoPartnersAdmin"] });
      queryClient.invalidateQueries({ queryKey: ["casinoPartnersPublic"] }); // Invalidate public cache too
      onClose();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Failed to create partner.");
    },
  });

  const updateMutation = useMutation({
    mutationFn: (updatedPartner: Partial<ICasinoPartner>) =>
      axios.put(`/api/admin/casino-partners/${partner?._id}`, updatedPartner),
    onSuccess: () => {
      toast.success("Casino Partner updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["casinoPartnersAdmin"] });
      queryClient.invalidateQueries({ queryKey: ["casinoPartnersPublic"] }); // Invalidate public cache too
      onClose();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Failed to update partner.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !logoUrl.trim() || !redirectUrl.trim()) {
      toast.error("Name, Logo URL, and Redirect URL are required.");
      return;
    }

    const payload = {
      name,
      logoUrl,
      redirectUrl,
      description,
      isFeatured,
      isActive,
      order: Number(order),
    };

    if (partner) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-brand-secondary rounded-lg shadow-xl w-full max-w-2xl overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-gray-700">
          <h2 className="text-2xl font-bold text-white">
            {partner ? "Edit Casino Partner" : "Create New Casino Partner"}
          </h2>
          <button
            onClick={onClose}
            className="text-brand-muted hover:text-white"
          >
            <XCircle size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-brand-light mb-1"
            >
              Partner Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-3 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-purple"
              required
              disabled={isPending}
            />
          </div>
          <div>
            <label
              htmlFor="logoUrl"
              className="block text-sm font-medium text-brand-light mb-1"
            >
              Logo URL
            </label>
            <input
              id="logoUrl"
              type="url"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              className="w-full p-3 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-purple"
              required
              disabled={isPending}
            />
            {logoUrl && (
              <div className="mt-2 text-center">
                <Image
                  src={logoUrl}
                  alt="Logo Preview"
                  width={80}
                  height={40}
                  objectFit="contain"
                  className="rounded-md bg-gray-800 p-1"
                />
              </div>
            )}
          </div>
          <div>
            <label
              htmlFor="redirectUrl"
              className="block text-sm font-medium text-brand-light mb-1"
            >
              Redirect URL (Affiliate Link)
            </label>
            <input
              id="redirectUrl"
              type="url"
              value={redirectUrl}
              onChange={(e) => setRedirectUrl(e.target.value)}
              className="w-full p-3 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-purple"
              required
              disabled={isPending}
            />
            <p className="text-xs text-brand-muted mt-1">
              This is the link users will be redirected to.
            </p>
          </div>
          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-brand-light mb-1"
            >
              Description (Optional)
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-3 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-purple resize-y"
              rows={3}
              disabled={isPending}
              placeholder="A short internal description of the partner."
            />
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4 space-y-3 sm:space-y-0">
            <div className="flex items-center">
              <input
                id="isFeatured"
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="w-4 h-4 text-brand-purple bg-gray-700 border-gray-600 rounded focus:ring-brand-purple"
                disabled={isPending}
              />
              <label
                htmlFor="isFeatured"
                className="ml-2 text-sm font-medium text-brand-light"
              >
                Featured (Prominent Styling)
              </label>
            </div>
            <div className="flex items-center">
              <input
                id="isActive"
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 text-brand-purple bg-gray-700 border-gray-600 rounded focus:ring-brand-purple"
                disabled={isPending}
              />
              <label
                htmlFor="isActive"
                className="ml-2 text-sm font-medium text-brand-light"
              >
                Active (Display on site)
              </label>
            </div>
            <div className="flex-grow">
              <label
                htmlFor="order"
                className="block text-sm font-medium text-brand-light mb-1 sm:mb-0"
              >
                Order
              </label>
              <input
                id="order"
                type="number"
                value={order}
                onChange={(e) => setOrder(Number(e.target.value))}
                className="w-20 p-2 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-purple"
                disabled={isPending}
                min="0"
              />
              <p className="text-xs text-brand-muted mt-1">
                Lower number = higher priority.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-600 text-white font-bold py-2 px-4 rounded-lg hover:opacity-90 disabled:opacity-50"
              disabled={isPending}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-brand-purple text-white font-bold py-2 px-4 rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              disabled={isPending}
            >
              {isPending ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <CheckCircle size={18} />
              )}
              {isPending
                ? partner
                  ? "Updating..."
                  : "Creating..."
                : partner
                ? "Save Changes"
                : "Create Partner"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- Main Casino Partners Page Component ---
export default function AdminCasinoPartnersPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<ICasinoPartner | null>(
    null
  );

  const {
    data: partners,
    isLoading,
    error,
  } = useQuery<ICasinoPartner[]>({
    queryKey: ["casinoPartnersAdmin"],
    queryFn: async () => {
      const { data } = await axios.get("/api/admin/casino-partners");
      return data;
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  const deleteMutation = useMutation({
    mutationFn: (partnerId: string) =>
      axios.delete(`/api/admin/casino-partners/${partnerId}`),
    onSuccess: () => {
      toast.success("Casino Partner deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ["casinoPartnersAdmin"] });
      queryClient.invalidateQueries({ queryKey: ["casinoPartnersPublic"] }); // Invalidate public cache too
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Failed to delete partner.");
    },
  });

  const handleOpenCreateModal = () => {
    setEditingPartner(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (partner: ICasinoPartner) => {
    setEditingPartner(partner);
    setIsModalOpen(true);
  };

  const handleDelete = (partnerId: string, partnerName: string) => {
    if (
      window.confirm(
        `Are you sure you want to delete Casino Partner "${partnerName}"? This action cannot be undone.`
      )
    ) {
      deleteMutation.mutate(partnerId);
    }
  };

  if (isLoading)
    return <p className="text-brand-muted">Loading Casino Partners...</p>;
  if (error)
    return <p className="text-red-400">Failed to load Casino Partners.</p>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white flex items-center gap-2">
          <Crown size={28} /> Manage Casino Partners
        </h1>
        <button
          onClick={handleOpenCreateModal}
          className="flex items-center gap-2 bg-brand-purple text-white font-bold py-2 px-4 rounded-lg hover:opacity-90"
        >
          <PlusCircle size={20} />
          <span>New Partner</span>
        </button>
      </div>

      <div className="bg-brand-secondary rounded-lg overflow-x-auto">
        <table className="w-full text-left text-brand-light">
          <thead className="bg-gray-800/50 text-sm text-brand-muted uppercase">
            <tr>
              <th className="p-4">Logo</th>
              <th className="p-4">Name</th>
              <th className="p-4">Featured</th>
              <th className="p-4">Active</th>
              <th className="p-4">Order</th>
              <th className="p-4">Description</th>
              <th className="p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {partners?.map((partner) => (
              <tr key={partner._id} className="border-t border-gray-700/50">
                <td className="p-4">
                  {partner.logoUrl && (
                    <Image
                      src={partner.logoUrl}
                      alt={partner.name}
                      width={60}
                      height={30}
                      objectFit="contain"
                      className="rounded-md bg-gray-700 p-1"
                    />
                  )}
                </td>
                <td className="p-4 font-medium">{partner.name}</td>
                <td className="p-4">
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      partner.isFeatured
                        ? "bg-yellow-500/20 text-yellow-400"
                        : "bg-gray-600/20 text-gray-400"
                    }`}
                  >
                    {partner.isFeatured ? "Yes" : "No"}
                  </span>
                </td>
                <td className="p-4">
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      partner.isActive
                        ? "bg-green-500/20 text-green-400"
                        : "bg-red-500/20 text-red-400"
                    }`}
                  >
                    {partner.isActive ? "Yes" : "No"}
                  </span>
                </td>
                <td className="p-4 text-brand-muted">{partner.order}</td>
                <td
                  className="p-4 text-brand-muted text-sm max-w-[200px] truncate"
                  title={partner.description}
                >
                  {partner.description || "N/A"}
                </td>
                <td className="p-4 flex gap-3 items-center h-full">
                  <a
                    href={partner.redirectUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand-muted hover:text-white"
                    title="Go to Partner Site"
                  >
                    <ExternalLink size={18} />
                  </a>
                  <button
                    onClick={() => handleOpenEditModal(partner)}
                    className="text-blue-400 hover:text-blue-300"
                    title="Edit Partner"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(partner._id, partner.name)}
                    className="text-red-400 hover:text-red-300"
                    title="Delete Partner"
                  >
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {partners?.length === 0 && (
          <p className="text-center p-8 text-brand-muted">
            No Casino Partners found. Click "New Partner" to create one.
          </p>
        )}
      </div>

      <CasinoPartnerFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        partner={editingPartner}
      />
    </div>
  );
}
