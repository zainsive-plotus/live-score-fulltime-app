// ===== src\app\admin\ai-journalists\page.tsx =====
// src/app/admin/ai-journalists/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import toast from "react-hot-toast";
import {
  PlusCircle,
  Edit,
  Trash2,
  User,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react";

// Assuming IAIJournalist interface is defined, otherwise define it here
interface IAIJournalist {
  _id: string;
  name: string;
  description?: string;
  tonePrompt: string;
  isActive: boolean;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

// Reusable form modal for creating/editing AI Journalists
interface AIJournalistFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  journalist?: IAIJournalist | null; // Optional: for editing
}

const AIJournalistFormModal: React.FC<AIJournalistFormModalProps> = ({
  isOpen,
  onClose,
  journalist,
}) => {
  const queryClient = useQueryClient();
  const [name, setName] = useState(journalist?.name || "");
  const [description, setDescription] = useState(journalist?.description || "");
  // --- MODIFIED: Default tonePrompt to Turkish ---
  const [tonePrompt, setTonePrompt] = useState(
    journalist?.tonePrompt ||
      "Daima Türkçe bir ton kullanın, esprili yorumlarla ve derinlemesine analitik ve teknik yorumlarla makaleleri şekillendirin."
  );
  const [isActive, setIsActive] = useState(journalist?.isActive ?? true); // Default to true for new

  useEffect(() => {
    // Reset form fields when journalist prop changes (for editing)
    if (journalist) {
      setName(journalist.name);
      setDescription(journalist.description || "");
      setTonePrompt(journalist.tonePrompt);
      setIsActive(journalist.isActive);
    } else {
      // Clear form for new creation and set Turkish default
      setName("");
      setDescription("");
      setTonePrompt(
        "Daima Türkçe bir ton kullanın, esprili yorumlarla ve derinlemesine analitik ve teknik yorumlarla makaleleri şekillendirin."
      );
      setIsActive(true);
    }
  }, [journalist]);

  const createMutation = useMutation({
    mutationFn: (newJournalist: Partial<IAIJournalist>) =>
      axios.post("/api/admin/ai-journalists", newJournalist),
    onSuccess: () => {
      toast.success("AI Journalist created successfully!");
      queryClient.invalidateQueries({ queryKey: ["aiJournalists"] });
      onClose();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Failed to create journalist.");
    },
  });

  const updateMutation = useMutation({
    mutationFn: (updatedJournalist: Partial<IAIJournalist>) =>
      axios.put(
        `/api/admin/ai-journalists/${journalist?._id}`,
        updatedJournalist
      ),
    onSuccess: () => {
      toast.success("AI Journalist updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["aiJournalists"] });
      onClose();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Failed to update journalist.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !tonePrompt.trim()) {
      toast.error("Name and Tone Prompt are required.");
      return;
    }

    const payload = { name, description, tonePrompt, isActive };

    if (journalist) {
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
            {journalist ? "Edit AI Journalist" : "Create New AI Journalist"}
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
              Journalist Name
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
              htmlFor="description"
              className="block text-sm font-medium text-brand-light mb-1"
            >
              Description (Optional)
            </label>
            <input
              id="description"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-3 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-purple"
              disabled={isPending}
            />
          </div>
          <div>
            <label
              htmlFor="tonePrompt"
              className="block text-sm font-medium text-brand-light mb-1"
            >
              Tone Prompt Segment (Turkish Language)
            </label>
            <textarea
              id="tonePrompt"
              value={tonePrompt}
              onChange={(e) => setTonePrompt(e.target.value)}
              className="w-full p-3 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-purple resize-y"
              rows={6}
              required
              disabled={isPending}
              placeholder="e.g., 'Daima Türkçe bir ton kullanın, esprili yorumlarla ve derinlemesine analitik ve teknik yorumlarla makaleleri şekillendirin.'"
            />
            <p className="text-xs text-brand-muted mt-1">
              Bu istem segmenti, gazetecinin stilini tanımlamak için ana makale
              oluşturma istemine eklenecektir. Makalelerin daima Türkçe
              oluşturulduğundan emin olun.
            </p>
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
              Active (Can be used for generation)
            </label>
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
                ? journalist
                  ? "Updating..."
                  : "Creating..."
                : journalist
                ? "Save Changes"
                : "Create Journalist"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- Main AI Journalists Page Component (UNCHANGED) ---
export default function AdminAIJournalistsPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingJournalist, setEditingJournalist] =
    useState<IAIJournalist | null>(null);

  const {
    data: journalists,
    isLoading,
    error,
  } = useQuery<IAIJournalist[]>({
    queryKey: ["aiJournalists"],
    queryFn: async () => {
      const { data } = await axios.get("/api/admin/ai-journalists");
      return data;
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  const deleteMutation = useMutation({
    mutationFn: (journalistId: string) =>
      axios.delete(`/api/admin/ai-journalists/${journalistId}`),
    onSuccess: () => {
      toast.success("AI Journalist deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ["aiJournalists"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Failed to delete journalist.");
    },
  });

  const handleOpenCreateModal = () => {
    setEditingJournalist(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (journalist: IAIJournalist) => {
    setEditingJournalist(journalist);
    setIsModalOpen(true);
  };

  const handleDelete = (journalistId: string, journalistName: string) => {
    if (
      window.confirm(
        `Are you sure you want to delete AI Journalist "${journalistName}"? This action cannot be undone.`
      )
    ) {
      deleteMutation.mutate(journalistId);
    }
  };

  if (isLoading)
    return <p className="text-brand-muted">Loading AI Journalists...</p>;
  if (error)
    return <p className="text-red-400">Failed to load AI Journalists.</p>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white flex items-center gap-2">
          <User size={28} /> Manage AI Journalists
        </h1>
        <button
          onClick={handleOpenCreateModal}
          className="flex items-center gap-2 bg-brand-purple text-white font-bold py-2 px-4 rounded-lg hover:opacity-90"
        >
          <PlusCircle size={20} />
          <span>New Journalist</span>
        </button>
      </div>

      <div className="bg-brand-secondary rounded-lg overflow-x-auto">
        <table className="w-full text-left text-brand-light">
          <thead className="bg-gray-800/50 text-sm text-brand-muted uppercase">
            <tr>
              <th className="p-4">Name</th>
              <th className="p-4">Description</th>
              <th className="p-4">Tone Prompt Preview</th>
              <th className="p-4">Status</th>
              <th className="p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {journalists?.map((journalist) => (
              <tr key={journalist._id} className="border-t border-gray-700/50">
                <td className="p-4 font-medium">{journalist.name}</td>
                <td
                  className="p-4 text-brand-muted text-sm max-w-[200px] truncate"
                  title={journalist.description}
                >
                  {journalist.description || "N/A"}
                </td>
                <td
                  className="p-4 text-brand-muted text-sm max-w-[300px] truncate"
                  title={journalist.tonePrompt}
                >
                  {journalist.tonePrompt}
                </td>
                <td className="p-4">
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      journalist.isActive
                        ? "bg-green-500/20 text-green-400"
                        : "bg-red-500/20 text-red-400"
                    }`}
                  >
                    {journalist.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="p-4 flex gap-3 items-center h-full">
                  <button
                    onClick={() => handleOpenEditModal(journalist)}
                    className="text-blue-400 hover:text-blue-300"
                    title="Edit Journalist"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() =>
                      handleDelete(journalist._id, journalist.name)
                    }
                    className="text-red-400 hover:text-red-300"
                    title="Delete Journalist"
                  >
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {journalists?.length === 0 && (
          <p className="text-center p-8 text-brand-muted">
            No AI Journalists found. Click "New Journalist" to create one.
          </p>
        )}
      </div>

      <AIJournalistFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        journalist={editingJournalist}
      />
    </div>
  );
}
