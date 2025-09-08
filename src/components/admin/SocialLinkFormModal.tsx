// ===== src/components/admin/SocialLinkFormModal.tsx =====

"use client";

import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import toast from "react-hot-toast";
import { ISocialLink, SupportedPlatform } from "@/models/SocialLink";
import { XCircle, Save, Loader2 } from "lucide-react";

interface SocialLinkFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  link: ISocialLink | null;
}

type FormData = Omit<ISocialLink, "_id" | "createdAt" | "updatedAt">;

// This matches the enum/type in your Mongoose model
const SUPPORTED_PLATFORMS: SupportedPlatform[] = [
  "facebook",
  "twitter",
  "instagram",
  "youtube",
  "linkedin",
  "telegram",
  "discord",
];

export default function SocialLinkFormModal({
  isOpen,
  onClose,
  link,
}: SocialLinkFormModalProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<FormData>({
    platform: "twitter",
    url: "",
    order: 0,
    isActive: true,
  });

  useEffect(() => {
    if (isOpen) {
      if (link) {
        setFormData({
          platform: link.platform,
          url: link.url,
          order: link.order,
          isActive: link.isActive,
        });
      } else {
        // Reset form for creating a new link
        setFormData({
          platform: "twitter",
          url: "",
          order: 0,
          isActive: true,
        });
      }
    }
  }, [link, isOpen]);

  const mutation = useMutation({
    mutationFn: (linkData: FormData) => {
      if (link?._id) {
        return axios.put(`/api/admin/social-links/${link._id}`, linkData);
      }
      return axios.post("/api/admin/social-links", linkData);
    },
    onSuccess: () => {
      toast.success(`Link ${link ? "updated" : "created"} successfully!`);
      queryClient.invalidateQueries({ queryKey: ["adminSocialLinks"] });
      onClose();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "An error occurred.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.platform || !formData.url) {
      toast.error("Platform and URL are required.");
      return;
    }
    mutation.mutate(formData);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const isCheckbox = type === "checkbox";
    const inputValue = isCheckbox
      ? (e.target as HTMLInputElement).checked
      : value;
    setFormData((prev) => ({ ...prev, [name]: inputValue }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-brand-secondary rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-gray-700 flex-shrink-0">
          <h2 className="text-2xl font-bold text-white">
            {link ? "Edit Social Link" : "Create New Social Link"}
          </h2>
          <button
            onClick={onClose}
            className="text-brand-muted hover:text-white"
          >
            <XCircle size={24} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-6 space-y-5 overflow-y-auto custom-scrollbar"
        >
          <div>
            <label
              htmlFor="platform"
              className="block text-sm font-medium text-brand-light mb-1"
            >
              Platform
            </label>
            <select
              id="platform"
              name="platform"
              value={formData.platform}
              onChange={handleInputChange}
              required
              className="w-full p-2.5 rounded bg-gray-700 text-white border border-gray-600"
            >
              {SUPPORTED_PLATFORMS.map((p) => (
                <option key={p} value={p} className="capitalize">
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="url"
              className="block text-sm font-medium text-brand-light mb-1"
            >
              Profile URL
            </label>
            <input
              type="url"
              id="url"
              name="url"
              value={formData.url}
              onChange={handleInputChange}
              required
              className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600"
              placeholder="https://x.com/yourprofile"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="order"
                className="block text-sm font-medium text-brand-light mb-1"
              >
                Display Order
              </label>
              <input
                type="number"
                id="order"
                name="order"
                value={formData.order}
                onChange={handleInputChange}
                className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600"
              />
              <p className="text-xs text-brand-muted mt-1">
                Lower number appears first.
              </p>
            </div>
            <div className="flex items-center pt-6">
              <input
                id="isActive"
                name="isActive"
                type="checkbox"
                checked={formData.isActive}
                onChange={handleInputChange}
                className="w-4 h-4 text-brand-purple bg-gray-700 border-gray-600 rounded"
              />
              <label
                htmlFor="isActive"
                className="ml-2 text-sm font-medium text-brand-light"
              >
                Active
              </label>
            </div>
          </div>
        </form>

        <div className="flex justify-end gap-3 p-6 border-t border-gray-700 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="bg-gray-600 text-white font-bold py-2 px-4 rounded-lg hover:opacity-90"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={mutation.isPending}
            className="bg-brand-purple text-white font-bold py-2 px-4 rounded-lg disabled:opacity-50 flex items-center gap-2"
          >
            {mutation.isPending ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Save size={18} />
            )}
            {mutation.isPending
              ? "Saving..."
              : link
              ? "Save Changes"
              : "Create Link"}
          </button>
        </div>
      </div>
    </div>
  );
}
