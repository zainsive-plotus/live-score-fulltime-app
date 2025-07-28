// ===== src/app/admin/ticker-messages/page.tsx =====

"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import toast from "react-hot-toast";
import { PlusCircle, Megaphone, Info } from "lucide-react";
import { ITickerMessage } from "@/models/TickerMessage";
import { ILanguage } from "@/models/Language";
import {TickerFormModal} from "@/components/admin/TickerFormModal";
import TickerTranslationGroupRow from "@/components/admin/TickerTranslationGroupRow";

const fetchActiveLanguages = async (): Promise<ILanguage[]> => {
  const { data } = await axios.get("/api/admin/languages?active=true");
  return data;
};

const fetchTickerMessages = async (): Promise<ITickerMessage[]> => {
  const { data } = await axios.get("/api/admin/ticker-messages");
  return data;
};

export default function AdminTickerMessagesPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMessage, setEditingMessage] = useState<ITickerMessage | null>(null);

  const { data: messages, isLoading: isLoadingMessages } = useQuery<ITickerMessage[]>({
    queryKey: ["tickerMessagesAdmin"],
    queryFn: fetchTickerMessages,
  });

  const { data: languages, isLoading: isLoadingLanguages } = useQuery<ILanguage[]>({
    queryKey: ["activeLanguages"],
    queryFn: fetchActiveLanguages,
  });

  const groupedMessages = useMemo(() => {
    if (!messages) return [];
    const groups: Record<string, ITickerMessage[]> = {};
    messages.forEach((msg) => {
      // Use the message's own ID as a fallback for legacy data
      const groupId = (msg.translationGroupId ?? msg._id).toString();
      if (!groups[groupId]) {
        groups[groupId] = [];
      }
      groups[groupId].push(msg);
    });
    return Object.values(groups).sort(
      (a, b) => new Date(b[0].createdAt).getTime() - new Date(a[0].createdAt).getTime()
    );
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
  
  const handleOpenEditModal = (message: ITickerMessage) => {
    setEditingMessage(message);
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
              <th className="p-4 w-20">Order</th>
              <th className="p-4">Message Content</th>
              <th className="p-4">Translations</th>
              <th className="p-4 text-center">Status</th>
              <th className="p-4 text-center">Actions</th>
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
                  onEdit={(message) => handleOpenEditModal(message)}
                />
              ))
            ) : (
                <tr>
                    <td colSpan={5} className="text-center p-8 text-brand-muted">
                        <Info size={24} className="mx-auto mb-2" />
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