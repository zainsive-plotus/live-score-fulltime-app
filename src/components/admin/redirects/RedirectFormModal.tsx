// ===== src/components/admin/redirects/RedirectFormModal.tsx (NEW FILE) =====
"use client";

import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import toast from "react-hot-toast";
import { IRedirect } from "@/models/Redirect";
import { XCircle, Save, Loader2, Info } from "lucide-react";

interface RedirectFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  redirect: Partial<IRedirect> | null;
}

type FormData = Omit<IRedirect, "_id" | "createdAt" | "updatedAt">;

export default function RedirectFormModal({
  isOpen,
  onClose,
  redirect,
}: RedirectFormModalProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<any>({
    sourcePaths: [],
    destinationUrl: "",
    statusCode: 301,
    isActive: true,
    notes: "",
  });
  const [sourcePathsInput, setSourcePathsInput] = useState("");

  useEffect(() => {
    if (redirect) {
      setFormData({
        sourcePaths: redirect.sourcePaths || [],
        destinationUrl: redirect.destinationUrl || "",
        statusCode: redirect.statusCode || 301,
        isActive: redirect.isActive !== undefined ? redirect.isActive : true,
        notes: redirect.notes || "",
      });
      setSourcePathsInput((redirect.sourcePaths || []).join(", "));
    } else {
      setFormData({
        sourcePaths: [],
        destinationUrl: "",
        statusCode: 301,
        isActive: true,
        notes: "",
      });
      setSourcePathsInput("");
    }
  }, [redirect, isOpen]);

  const mutation = useMutation({
    mutationFn: (newRedirectData: FormData) => {
      if ((redirect as IRedirect)?._id) {
        return axios.put(
          `/api/admin/redirects/${(redirect as IRedirect)._id}`,
          newRedirectData
        );
      }
      return axios.post("/api/admin/redirects", newRedirectData);
    },
    onSuccess: () => {
      toast.success(
        `Redirect ${redirect?._id ? "updated" : "created"} successfully!`
      );
      queryClient.invalidateQueries({ queryKey: ["redirectsAdmin"] });
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "An error occurred.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const sourcePathsArray = sourcePathsInput
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);
    if (sourcePathsArray.length === 0 || !formData.destinationUrl) {
      toast.error(
        "At least one Source Path and a Destination URL are required."
      );
      return;
    }
    mutation.mutate({ ...formData, sourcePaths: sourcePathsArray });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-brand-secondary rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-gray-700">
          <h2 className="text-2xl font-bold text-white">
            {redirect?._id ? "Edit Redirect Rule" : "Create New Redirect Rule"}
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
            <label className="block text-sm font-medium text-brand-light mb-1">
              Source Path(s)
            </label>
            <textarea
              value={sourcePathsInput}
              onChange={(e) => setSourcePathsInput(e.target.value)}
              required
              rows={3}
              className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600 font-mono text-sm"
              placeholder="/old-page/article-1, /another/old-path"
            />
            <p className="text-xs text-brand-muted mt-1">
              Enter one or more paths, separated by commas. Do not include the
              domain. E.g., `/path/to/page`
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-brand-light mb-1">
              Destination URL
            </label>
            <input
              type="text"
              value={formData.destinationUrl}
              onChange={(e) =>
                setFormData({ ...formData, destinationUrl: e.target.value })
              }
              required
              className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600 font-mono text-sm"
              placeholder="/new-page or https://external-site.com"
            />
            <p className="text-xs text-brand-muted mt-1">
              Can be an internal path (e.g., `/football/news`) or a full
              external URL.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-brand-light mb-1">
                Redirect Type
              </label>
              <select
                value={formData.statusCode}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    statusCode: parseInt(e.target.value) as 301 | 302,
                  })
                }
                className="w-full p-2.5 rounded bg-gray-700 text-white border border-gray-600"
              >
                <option value={301}>301 - Permanent</option>
                <option value={302}>302 - Temporary</option>
              </select>
            </div>
            <div className="flex items-center pt-6">
              <input
                id="isActive"
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) =>
                  setFormData({ ...formData, isActive: e.target.checked })
                }
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
          <div>
            <label className="block text-sm font-medium text-brand-light mb-1">
              Notes (Optional)
            </label>
            <input
              type="text"
              value={formData.notes || ""}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600"
              placeholder="e.g., Redirect for old site structure migration"
            />
          </div>
        </form>
        <div className="flex justify-end gap-3 p-6 border-t border-gray-700">
          <button
            type="button"
            onClick={onClose}
            className="bg-gray-600 text-white font-bold py-2 px-4 rounded-lg"
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
            {mutation.isPending ? "Saving..." : "Save Rule"}
          </button>
        </div>
      </div>
    </div>
  );
}
