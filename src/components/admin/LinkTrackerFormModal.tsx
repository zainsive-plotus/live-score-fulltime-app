// ===== src/components/admin/LinkTrackerFormModal.tsx =====

"use client";

import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import toast from "react-hot-toast";
import { ITrackedLink } from "@/models/TrackedLink";
import { XCircle, Save, Loader2 } from "lucide-react";

interface LinkTrackerFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  link: ITrackedLink | null;
}

type FormData = Omit<
  ITrackedLink,
  | "_id"
  | "createdAt"
  | "updatedAt"
  | "shortCode"
  | "fullShortLink"
  | "clickCount"
  | "analytics"
>;

export default function LinkTrackerFormModal({
  isOpen,
  onClose,
  link,
}: LinkTrackerFormModalProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<FormData>({
    originalUrl: "",
    description: "",
    utmSource: "",
    utmMedium: "",
    utmCampaign: "",
    isActive: true,
  });

  useEffect(() => {
    if (isOpen) {
      if (link) {
        setFormData({
          originalUrl: link.originalUrl,
          description: link.description,
          utmSource: link.utmSource || "",
          utmMedium: link.utmMedium || "",
          utmCampaign: link.utmCampaign || "",
          isActive: link.isActive,
        });
      } else {
        // Reset form for creating a new link
        setFormData({
          originalUrl: "",
          description: "",
          utmSource: "",
          utmMedium: "",
          utmCampaign: "",
          isActive: true,
        });
      }
    }
  }, [link, isOpen]);

  const mutation = useMutation({
    mutationFn: (linkData: FormData) => {
      if (link?._id) {
        return axios.put(`/api/admin/tracked-links/${link._id}`, linkData);
      }
      return axios.post("/api/admin/tracked-links", linkData);
    },
    onSuccess: () => {
      toast.success(`Link ${link ? "updated" : "created"} successfully!`);
      queryClient.invalidateQueries({ queryKey: ["trackedLinks"] });
      onClose();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "An error occurred.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.originalUrl || !formData.description) {
      toast.error("Original URL and Description are required.");
      return;
    }
    mutation.mutate(formData);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const isCheckbox = type === "checkbox";
    // @ts-ignore
    const inputValue = isCheckbox
      ? (e.target as HTMLInputElement).checked
      : value;

    setFormData((prev) => ({ ...prev, [name]: inputValue }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-brand-secondary rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-gray-700 flex-shrink-0">
          <h2 className="text-2xl font-bold text-white">
            {link ? "Edit Tracked Link" : "Create New Tracked Link"}
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
              htmlFor="description"
              className="block text-sm font-medium text-brand-light mb-1"
            >
              Description (Internal)
            </label>
            <input
              type="text"
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              required
              className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600"
              placeholder="e.g., Guest Post on SoccerBlogz - Oct 2024"
            />
          </div>
          <div>
            <label
              htmlFor="originalUrl"
              className="block text-sm font-medium text-brand-light mb-1"
            >
              Destination URL
            </label>
            <input
              type="url"
              id="originalUrl"
              name="originalUrl"
              value={formData.originalUrl}
              onChange={handleInputChange}
              required
              className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600"
              placeholder="https://www.fanskor.com/en/football/team/as-roma-497"
            />
          </div>

          <fieldset className="p-4 border border-gray-700 rounded-lg">
            <legend className="text-sm font-semibold text-brand-light px-2">
              UTM Parameters (Optional)
            </legend>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
              <div>
                <label
                  htmlFor="utmSource"
                  className="block text-xs font-medium text-brand-muted mb-1"
                >
                  Source
                </label>
                <input
                  type="text"
                  id="utmSource"
                  name="utmSource"
                  value={formData.utmSource}
                  onChange={handleInputChange}
                  className="w-full p-2 rounded bg-gray-800 text-white border border-gray-600 text-sm"
                  placeholder="guest-post"
                />
              </div>
              <div>
                <label
                  htmlFor="utmMedium"
                  className="block text-xs font-medium text-brand-muted mb-1"
                >
                  Medium
                </label>
                <input
                  type="text"
                  id="utmMedium"
                  name="utmMedium"
                  value={formData.utmMedium}
                  onChange={handleInputChange}
                  className="w-full p-2 rounded bg-gray-800 text-white border border-gray-600 text-sm"
                  placeholder="referral"
                />
              </div>
              <div>
                <label
                  htmlFor="utmCampaign"
                  className="block text-xs font-medium text-brand-muted mb-1"
                >
                  Campaign
                </label>
                <input
                  type="text"
                  id="utmCampaign"
                  name="utmCampaign"
                  value={formData.utmCampaign}
                  onChange={handleInputChange}
                  className="w-full p-2 rounded bg-gray-800 text-white border border-gray-600 text-sm"
                  placeholder="soccerblogz-oct24"
                />
              </div>
            </div>
          </fieldset>

          <div className="flex items-center">
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
              Active (Link will redirect)
            </label>
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
