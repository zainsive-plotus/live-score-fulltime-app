// ===== src/app/admin/title-templates/page.tsx =====

"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import toast from "react-hot-toast";
import {
  PlusCircle,
  Edit,
  Trash2,
  FileText,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react";
import { ITitleTemplate } from "@/models/TitleTemplate";

// --- Form Modal Component ---

interface TitleTemplateFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  template?: ITitleTemplate | null;
}

const TitleTemplateFormModal: React.FC<TitleTemplateFormModalProps> = ({
  isOpen,
  onClose,
  template,
}) => {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [templateContent, setTemplateContent] = useState("");
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (template) {
      setName(template.name);
      setDescription(template.description || "");
      setTemplateContent(template.template);
      setIsActive(template.isActive);
    } else {
      setName("");
      setDescription("");
      setTemplateContent("");
      setIsActive(true);
    }
  }, [template]);

  const mutation = useMutation({
    mutationFn: (payload: Partial<ITitleTemplate>) =>
      template?._id
        ? axios.put(`/api/admin/title-templates/${template._id}`, payload)
        : axios.post("/api/admin/title-templates", payload),
    onSuccess: () => {
      toast.success(
        `Title Template ${template ? "updated" : "created"} successfully!`
      );
      queryClient.invalidateQueries({ queryKey: ["titleTemplates"] });
      onClose();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Failed to save the template.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !templateContent.trim()) {
      toast.error("Name and Template Content are required.");
      return;
    }
    mutation.mutate({
      name,
      description,
      template: templateContent,
      isActive,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-brand-secondary rounded-lg shadow-xl w-full max-w-2xl">
        <div className="flex justify-between items-center p-6 border-b border-gray-700">
          <h2 className="text-2xl font-bold text-white">
            {template ? "Edit Title Template" : "Create New Title Template"}
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
              Template Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-3 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-purple"
              required
              disabled={mutation.isPending}
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
              disabled={mutation.isPending}
            />
          </div>
          <div>
            <label
              htmlFor="templateContent"
              className="block text-sm font-medium text-brand-light mb-1"
            >
              Template Content
            </label>
            <textarea
              id="templateContent"
              value={templateContent}
              onChange={(e) => setTemplateContent(e.target.value)}
              className="w-full p-3 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-purple resize-y"
              rows={4}
              required
              disabled={mutation.isPending}
              placeholder="e.g., {original_title} hakkında şok gelişmeler!"
            />
            <p className="text-xs text-brand-muted mt-1">
              Available placeholders: <code>{`{original_title}`}</code>,{" "}
              <code>{`{original_description}`}</code>,{" "}
              <code>{`{journalist_name}`}</code>.
            </p>
          </div>
          <div className="flex items-center">
            <input
              id="isActive"
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 text-brand-purple bg-gray-700 border-gray-600 rounded focus:ring-brand-purple"
              disabled={mutation.isPending}
            />
            <label
              htmlFor="isActive"
              className="ml-2 text-sm font-medium text-brand-light"
            >
              Active (Available for selection in generation modal)
            </label>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
            <button
              type="button"
              onClick={onClose}
              disabled={mutation.isPending}
              className="bg-gray-600 text-white font-bold py-2 px-4 rounded-lg hover:opacity-90 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="bg-brand-purple text-white font-bold py-2 px-4 rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {mutation.isPending ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <CheckCircle size={18} />
              )}
              {mutation.isPending ? "Saving..." : "Save Template"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- Main Page Component ---

export default function AdminTitleTemplatesPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ITitleTemplate | null>(
    null
  );

  const {
    data: templates,
    isLoading,
    error,
  } = useQuery<ITitleTemplate[]>({
    queryKey: ["titleTemplates"],
    queryFn: async () => {
      const { data } = await axios.get("/api/admin/title-templates");
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (templateId: string) =>
      axios.delete(`/api/admin/title-templates/${templateId}`),
    onSuccess: () => {
      toast.success("Template deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ["titleTemplates"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Failed to delete template.");
    },
  });

  const handleOpenCreateModal = () => {
    setEditingTemplate(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (template: ITitleTemplate) => {
    setEditingTemplate(template);
    setIsModalOpen(true);
  };

  const handleDelete = (templateId: string, templateName: string) => {
    if (
      window.confirm(
        `Are you sure you want to delete template "${templateName}"?`
      )
    ) {
      deleteMutation.mutate(templateId);
    }
  };

  if (isLoading)
    return <p className="text-brand-muted">Loading templates...</p>;
  if (error) return <p className="text-red-400">Failed to load templates.</p>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white flex items-center gap-2">
          <FileText size={28} /> Manage Title Templates
        </h1>
        <button
          onClick={handleOpenCreateModal}
          className="flex items-center gap-2 bg-brand-purple text-white font-bold py-2 px-4 rounded-lg hover:opacity-90"
        >
          <PlusCircle size={20} />
          <span>New Template</span>
        </button>
      </div>

      <div className="bg-brand-secondary rounded-lg overflow-x-auto">
        <table className="w-full text-left text-brand-light">
          <thead className="bg-gray-800/50 text-sm text-brand-muted uppercase">
            <tr>
              <th className="p-4">Name</th>
              <th className="p-4">Template Preview</th>
              <th className="p-4">Status</th>
              <th className="p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {templates?.map((template) => (
              <tr key={template._id} className="border-t border-gray-700/50">
                <td className="p-4 font-medium">{template.name}</td>
                <td
                  className="p-4 text-brand-muted text-sm max-w-xl truncate font-mono"
                  title={template.template}
                >
                  {template.template}
                </td>
                <td className="p-4">
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      template.isActive
                        ? "bg-green-500/20 text-green-400"
                        : "bg-red-500/20 text-red-400"
                    }`}
                  >
                    {template.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="p-4 flex gap-3 items-center h-full">
                  <button
                    onClick={() => handleOpenEditModal(template)}
                    className="text-blue-400 hover:text-blue-300"
                    title="Edit Template"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(template._id, template.name)}
                    className="text-red-400 hover:text-red-300"
                    title="Delete Template"
                  >
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {templates?.length === 0 && (
          <p className="text-center p-8 text-brand-muted">
            No templates found. Click "New Template" to create one.
          </p>
        )}
      </div>

      <TitleTemplateFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        template={editingTemplate}
      />
    </div>
  );
}
