// ===== src/app/admin/ticker-messages/page.tsx =====

"use client";

import { useState, useEffect, useMemo } from "react";
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
  Megaphone,
} from "lucide-react";
import { ITickerMessage } from "@/models/TickerMessage";
import { ILanguage } from "@/models/Language";
import TickerTranslationGroupRow from "@/components/admin/TickerTranslationGroupRow";

const fetchActiveLanguages = async (): Promise<ILanguage[]> => {
  const { data } = await axios.get("/api/admin/languages?active=true");
  return data;
};

// --- Form Modal Component (Corrected) ---
interface TickerFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  message?: ITickerMessage | null;
}

const TickerFormModal: React.FC<TickerFormModalProps> = ({
  isOpen,
  onClose,
  message,
}) => {
  const queryClient = useQueryClient();
  const [content, setContent] = useState("");
  const [order, setOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [language, setLanguage] = useState("");

  const { data: languages, isLoading: isLoadingLanguages } = useQuery<ILanguage[]>({
    queryKey: ["activeLanguages"],
    queryFn: fetchActiveLanguages,
  });

  useEffect(() => {
    if (isOpen) {
      if (message) {
        setContent(message.message);
        setOrder(message.order);
        setIsActive(message.isActive);
        setLanguage(message.language);
      } else {
        // --- Start of Fix 1: Ensure language is initialized on create ---
        setContent("");
        setOrder(0);
        setIsActive(true);
        if (languages && languages.length > 0) {
          const defaultLang = languages.find((l) => l.isDefault)?.code || languages[0].code;
          setLanguage(defaultLang);
        } else {
          setLanguage(""); // Reset if no languages are loaded
        }
        // --- End of Fix 1 ---
      }
    }
  }, [message, languages, isOpen]);

  const mutation = useMutation({
    mutationFn: (payload: Partial<ITickerMessage>) => {
      if (message?._id) {
        return axios.put("/api/admin/ticker-messages", { _id: message._id, ...payload });
      }
      return axios.post("/api/admin/ticker-messages", payload);
    },
    onSuccess: () => {
      toast.success(`Message ${message ? "updated" : "created"} successfully!`);
      queryClient.invalidateQueries({ queryKey: ["tickerMessagesAdmin"] });
      onClose();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "An error occurred.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !language) {
      toast.error("Message content and language are required.");
      return;
    }
    // --- Start of Fix 2: Ensure language is included in the payload ---
    mutation.mutate({ message: content, order: Number(order), isActive, language });
    // --- End of Fix 2 ---
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-brand-secondary rounded-lg shadow-xl w-full max-w-lg">
        <div className="flex justify-between items-center p-6 border-b border-gray-700">
          <h2 className="text-2xl font-bold text-white">
            {message ? "Edit Ticker Message" : "Create New Ticker Message"}
          </h2>
          <button onClick={onClose} className="text-brand-muted hover:text-white">
            <XCircle size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-brand-light mb-1">Language</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              disabled={!!message || isLoadingLanguages}
              className="w-full p-3 rounded bg-gray-700 text-white border border-gray-600 disabled:opacity-50"
              required
            >
              <option value="" disabled>
                {isLoadingLanguages ? "Loading..." : "Select Language"}
              </option>
              {languages?.map((lang) => (
                <option key={lang.code} value={lang.code}>{lang.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-brand-light mb-1">Message Content</label>
            <input
              type="text"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full p-3 rounded bg-gray-700 text-white border border-gray-600"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-brand-light mb-1">Order</label>
              <input
                type="number"
                value={order}
                onChange={(e) => setOrder(Number(e.target.value))}
                className="w-full p-3 rounded bg-gray-700 text-white border border-gray-600"
              />
              <p className="text-xs text-brand-muted mt-1">Lower number displays first.</p>
            </div>
            <div className="flex items-center pt-6">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 text-brand-purple bg-gray-700 border-gray-600 rounded"
              />
              <label className="ml-2 text-sm font-medium text-brand-light">Active</label>
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
              {mutation.isPending ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
              {mutation.isPending ? "Saving..." : "Save Message"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- Main Page Component ---
export default function AdminTickerMessagesPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMessage, setEditingMessage] = useState<ITickerMessage | null>(null);

  const { data: messages, isLoading: isLoadingMessages } = useQuery<ITickerMessage[]>({
    queryKey: ["tickerMessagesAdmin"],
    queryFn: () => axios.get("/api/admin/ticker-messages").then((res) => res.data),
  });

  const { data: languages, isLoading: isLoadingLanguages } = useQuery<ILanguage[]>({
    queryKey: ["activeLanguages"],
    queryFn: fetchActiveLanguages,
  });

  const groupedMessages = useMemo(() => {
    if (!messages) return [];
    const groups: Record<string, ITickerMessage[]> = {};
    messages.forEach((msg) => {
      const groupId = (msg.translationGroupId ?? msg._id).toString();
      if (!groups[groupId]) {
        groups[groupId] = [];
      }
      groups[groupId].push(msg);
    });
    return Object.values(groups).sort((a, b) => new Date(b[0].createdAt).getTime() - new Date(a[0].createdAt).getTime());
  }, [messages]);

  const deleteMutation = useMutation({
    mutationFn: (messageId: string) => axios.delete("/api/admin/ticker-messages", { data: { id: messageId } }),
    onSuccess: () => {
      toast.success("Message deleted!");
      queryClient.invalidateQueries({ queryKey: ["tickerMessagesAdmin"] });
    },
    onError: (err: any) => toast.error(err.response?.data?.error || "Failed to delete message."),
  });

  const handleOpenCreateModal = () => {
    setEditingMessage(null);
    setIsModalOpen(true);
  };

  const isLoading = isLoadingMessages || isLoadingLanguages;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white flex items-center gap-2">
          <Megaphone size={28} /> Manage Ticker Messages
        </h1>
        <button
          onClick={handleOpenCreateModal}
          className="flex items-center gap-2 bg-brand-purple text-white font-bold py-2 px-4 rounded-lg hover:opacity-90"
        >
          <PlusCircle size={20} /> New Message
        </button>
      </div>
      <div className="bg-brand-secondary rounded-lg overflow-hidden">
        <table className="w-full text-left text-brand-light">
          <thead className="bg-gray-800/50 text-sm text-brand-muted uppercase">
            <tr>
              <th className="p-4">Order</th>
              <th className="p-4" colSpan={2}>
                Message & Translations
              </th>
              <th className="p-4">Status</th>
              <th className="p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={5} className="p-8 text-center text-brand-muted">Loading...</td></tr>
            ) : groupedMessages.length > 0 && languages ? (
              groupedMessages.map((group) => (
                <TickerTranslationGroupRow
                  key={group[0].translationGroupId?.toString() || group[0]._id.toString()}
                  group={group}
                  allActiveLanguages={languages}
                  onDelete={(id) => deleteMutation.mutate(id)}
                />
              ))
            ) : (
                <tr>
                    <td colSpan={5} className="text-center p-8 text-brand-muted">
                        No messages found. Click "New Message" to create one.
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>
      <TickerFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        message={editingMessage}
      />
    </div>
  );
}