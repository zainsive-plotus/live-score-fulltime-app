// src/app/admin/faqs/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import toast from "react-hot-toast";
import {
  PlusCircle,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Loader2,
  HelpCircle,
} from "lucide-react";
import CreatableSelect from "@/components/admin/CreatableSelect";

// --- Type Definitions ---
interface IFaq {
  _id: string;
  question: string;
  answer: string;
  category: string;
  order: number;
  isActive: boolean;
}

// Default state for a new FAQ form
const defaultFormState: Omit<IFaq, "_id"> = {
  question: "",
  answer: "",
  category: "General Questions",
  order: 0,
  isActive: true,
};

// --- FaqFormModal Component (Rewritten for Robust State Handling) ---
const FaqFormModal = ({
  isOpen,
  onClose,
  faq,
}: {
  isOpen: boolean;
  onClose: () => void;
  faq: IFaq | null;
}) => {
  const queryClient = useQueryClient();
  // --- FIX 1: Use a single state object for the form data ---
  const [formData, setFormData] = useState<Omit<IFaq, "_id">>(defaultFormState);

  useEffect(() => {
    if (isOpen) {
      if (faq) {
        // If editing, populate the form with the faq's data
        setFormData({
          question: faq.question,
          answer: faq.answer,
          category: faq.category,
          order: faq.order,
          isActive: faq.isActive,
        });
      } else {
        // If creating, reset to the default state
        setFormData(defaultFormState);
      }
    }
  }, [faq, isOpen]);

  // Helper to update a single field in the form data
  const handleFormChange = (field: keyof typeof formData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const mutation = useMutation({
    // --- FIX 2: The mutation function is now simpler and more explicit ---
    mutationFn: (faqData: Omit<IFaq, "_id"> & { _id?: string }) => {
      if (faqData._id) {
        return axios.put("/api/admin/faqs", faqData);
      }
      return axios.post("/api/admin/faqs", faqData);
    },
    onSuccess: () => {
      toast.success(`FAQ ${faq ? "updated" : "created"} successfully!`);
      queryClient.invalidateQueries({ queryKey: ["adminFaqs"] });
      queryClient.invalidateQueries({ queryKey: ["faqCategories"] });
      onClose();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "An error occurred.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !formData.question.trim() ||
      !formData.answer.trim() ||
      !formData.category.trim()
    ) {
      toast.error("Question, Answer, and Category are required.");
      return;
    }

    // --- FIX 3: Pass the most current formData state to the mutation ---
    const payload = { ...formData, ...(faq && { _id: faq._id }) };
    mutation.mutate(payload);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-brand-secondary rounded-lg shadow-xl w-full max-w-2xl">
        <div className="flex justify-between items-center p-6 border-b border-gray-700">
          <h2 className="text-2xl font-bold text-white">
            {faq ? "Edit FAQ" : "Create New FAQ"}
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
            <label className="block text-sm font-medium text-brand-light mb-1">
              Category
            </label>
            <CreatableSelect
              value={formData.category}
              onChange={(value) => handleFormChange("category", value)}
              placeholder="Select or create a category..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-brand-light mb-1">
              Question
            </label>
            <input
              type="text"
              value={formData.question}
              onChange={(e) => handleFormChange("question", e.target.value)}
              className="w-full p-3 rounded bg-gray-700 text-white border border-gray-600"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-brand-light mb-1">
              Answer (HTML allowed)
            </label>
            <textarea
              value={formData.answer}
              onChange={(e) => handleFormChange("answer", e.target.value)}
              className="w-full p-3 rounded bg-gray-700 text-white border border-gray-600 resize-y"
              rows={6}
              required
            />
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-brand-light mb-1">
                Order
              </label>
              <input
                type="number"
                value={formData.order}
                onChange={(e) =>
                  handleFormChange("order", Number(e.target.value))
                }
                className="w-full p-3 rounded bg-gray-700 text-white border border-gray-600"
              />
            </div>
            <div className="flex items-center pt-6">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => handleFormChange("isActive", e.target.checked)}
                className="w-4 h-4 text-brand-purple bg-gray-700 border-gray-600 rounded"
              />
              <label className="ml-2 text-sm font-medium text-brand-light">
                Active
              </label>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-600 text-white font-bold py-2 px-4 rounded-lg hover:opacity-90"
              disabled={mutation.isPending}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-brand-purple text-white font-bold py-2 px-4 rounded-lg disabled:opacity-50 flex items-center gap-2"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <CheckCircle size={18} />
              )}
              {mutation.isPending ? "Saving..." : "Save FAQ"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- Main Admin FAQs Page Component (Table part is unchanged) ---
export default function AdminFaqsPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<IFaq | null>(null);

  const {
    data: faqs,
    isLoading,
    error,
  } = useQuery<IFaq[]>({
    queryKey: ["adminFaqs"],
    queryFn: () => axios.get("/api/admin/faqs").then((res) => res.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (faqId: string) =>
      axios.delete("/api/admin/faqs", { data: { id: faqId } }),
    onSuccess: () => {
      toast.success("FAQ deleted!");
      queryClient.invalidateQueries({ queryKey: ["adminFaqs"] });
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.error || "Failed to delete FAQ."),
  });

  const handleOpenCreateModal = () => {
    setEditingFaq(null);
    setIsModalOpen(true);
  };
  const handleOpenEditModal = (faq: IFaq) => {
    setEditingFaq(faq);
    setIsModalOpen(true);
  };
  const handleDelete = (faqId: string) => {
    if (window.confirm("Are you sure?")) deleteMutation.mutate(faqId);
  };

  if (isLoading) return <p className="text-brand-muted">Loading FAQs...</p>;
  if (error) return <p className="text-red-400">Failed to load FAQs.</p>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white flex items-center gap-2">
          <HelpCircle size={28} /> Manage FAQs
        </h1>
        <button
          onClick={handleOpenCreateModal}
          className="flex items-center gap-2 bg-brand-purple text-white font-bold py-2 px-4 rounded-lg hover:opacity-90"
        >
          <PlusCircle size={20} /> New FAQ
        </button>
      </div>
      <div className="bg-brand-secondary rounded-lg overflow-x-auto">
        <table className="w-full text-left text-brand-light">
          <thead className="bg-gray-800/50 text-sm text-brand-muted uppercase">
            <tr>
              <th className="p-4">Order</th>
              <th className="p-4">Category</th>
              <th className="p-4">Question</th>
              <th className="p-4">Status</th>
              <th className="p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {faqs?.map((faq) => (
              <tr key={faq._id} className="border-t border-gray-700/50">
                <td className="p-4 w-20 text-center font-bold">{faq.order}</td>
                <td className="p-4 font-semibold text-brand-muted">
                  {faq.category}
                </td>
                <td className="p-4 font-medium">{faq.question}</td>
                <td className="p-4 w-32">
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      faq.isActive
                        ? "bg-green-500/20 text-green-400"
                        : "bg-red-500/20 text-red-400"
                    }`}
                  >
                    {faq.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="p-4 flex gap-3 items-center h-full">
                  <button
                    onClick={() => handleOpenEditModal(faq)}
                    className="text-blue-400 hover:text-blue-300"
                    title="Edit FAQ"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(faq._id)}
                    className="text-red-400 hover:text-red-300"
                    title="Delete FAQ"
                  >
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {faqs?.length === 0 && (
          <p className="text-center p-8 text-brand-muted">No FAQs found.</p>
        )}
      </div>
      <FaqFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        faq={editingFaq}
      />
    </div>
  );
}
