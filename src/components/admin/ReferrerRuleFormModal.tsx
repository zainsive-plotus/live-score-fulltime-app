// ===== src/components/admin/ReferrerRuleFormModal.tsx =====

"use client";

import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import toast from "react-hot-toast";
import { IReferrerRule } from "@/models/ReferrerRule";
import { XCircle, Save, Loader2 } from "lucide-react";

interface ReferrerRuleFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  rule: IReferrerRule | null;
}

type FormData = Omit<
  IReferrerRule,
  "_id" | "createdAt" | "updatedAt" | "hitCount" | "analytics"
>;

export default function ReferrerRuleFormModal({
  isOpen,
  onClose,
  rule,
}: ReferrerRuleFormModalProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<FormData>({
    sourceUrl: "",
    targetPage: "",
    description: "",
    isActive: true,
  });

  useEffect(() => {
    if (isOpen) {
      if (rule) {
        setFormData({
          sourceUrl: rule.sourceUrl,
          targetPage: rule.targetPage,
          description: rule.description,
          isActive: rule.isActive,
        });
      } else {
        // Reset form for creating a new rule
        setFormData({
          sourceUrl: "",
          targetPage: "",
          description: "",
          isActive: true,
        });
      }
    }
  }, [rule, isOpen]);

  const mutation = useMutation({
    mutationFn: (ruleData: FormData) => {
      if (rule?._id) {
        return axios.put(`/api/admin/referrer-rules/${rule._id}`, ruleData);
      }
      return axios.post("/api/admin/referrer-rules", ruleData);
    },
    onSuccess: () => {
      toast.success(`Rule ${rule ? "updated" : "created"} successfully!`);
      queryClient.invalidateQueries({ queryKey: ["referrerRules"] });
      onClose();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "An error occurred.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.sourceUrl || !formData.targetPage || !formData.description) {
      toast.error("All fields are required.");
      return;
    }
    mutation.mutate(formData);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    const inputValue = type === "checkbox" ? checked : value;
    setFormData((prev) => ({ ...prev, [name]: inputValue }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-brand-secondary rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-gray-700 flex-shrink-0">
          <h2 className="text-2xl font-bold text-white">
            {rule ? "Edit Referrer Rule" : "Create New Referrer Rule"}
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
              Description
            </label>
            <input
              type="text"
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              required
              className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600"
              placeholder="e.g., AS Roma feature on SoccerBlogz"
            />
            <p className="text-xs text-brand-muted mt-1">
              An internal note to identify this backlink.
            </p>
          </div>
          <div>
            <label
              htmlFor="sourceUrl"
              className="block text-sm font-medium text-brand-light mb-1"
            >
              Source URL
            </label>
            <input
              type="url"
              id="sourceUrl"
              name="sourceUrl"
              value={formData.sourceUrl}
              onChange={handleInputChange}
              required
              className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600"
              placeholder="https://soccerblogz.com/best-teams-2024"
            />
            <p className="text-xs text-brand-muted mt-1">
              The exact external URL that links to your site. Must be unique.
            </p>
          </div>
          <div>
            <label
              htmlFor="targetPage"
              className="block text-sm font-medium text-brand-light mb-1"
            >
              Expected Landing Page
            </label>
            <input
              type="text"
              id="targetPage"
              name="targetPage"
              value={formData.targetPage}
              onChange={handleInputChange}
              required
              className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600"
              placeholder="/en/football/team/as-roma-497"
            />
            <p className="text-xs text-brand-muted mt-1">
              The page on your site the backlink points to. For context only.
            </p>
          </div>
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
              Active (This rule is currently being tracked)
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
              : rule
              ? "Save Changes"
              : "Create Rule"}
          </button>
        </div>
      </div>
    </div>
  );
}
