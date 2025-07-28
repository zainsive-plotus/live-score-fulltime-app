// ===== src/components/admin/TickerTranslationGroupRow.tsx =====

"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import toast from "react-hot-toast";
import { ITickerMessage } from "@/models/TickerMessage";
import { ILanguage } from "@/models/Language";
import { Trash2, Languages, Loader2 } from "lucide-react";
import TranslationStatusPopover from "./TranslationStatusPopover"; // <-- Import the new component

interface TickerTranslationGroupRowProps {
  group: ITickerMessage[];
  allActiveLanguages: ILanguage[];
  onDelete: (messageId: string) => void;
}

export default function TickerTranslationGroupRow({
  group,
  allActiveLanguages,
  onDelete,
}: TickerTranslationGroupRowProps) {
  const queryClient = useQueryClient();
  const masterMessage = group[0];

  const translateMutation = useMutation({
    mutationFn: (sourceMessageId: string) =>
      axios.post("/api/admin/ticker-messages/translate", { sourceMessageId }),
    onSuccess: (data) => {
      toast.success(data.data.message || "Translations generated!");
      queryClient.invalidateQueries({ queryKey: ["tickerMessagesAdmin"] });
    },
    onError: (err: any) => {
      toast.error(
        err.response?.data?.error || "Failed to generate translations."
      );
    },
  });

  const handleTranslateAll = () => {
    translateMutation.mutate(masterMessage._id);
  };

  const handleDeleteAll = () => {
    if (
      window.confirm(
        `Are you sure you want to delete this message and all of its translations? This action cannot be undone.`
      )
    ) {
      group.forEach((msg) => onDelete(msg._id));
    }
  };

  return (
    <tr className="border-t-2 border-gray-800 bg-brand-secondary hover:bg-gray-800/50 transition-colors">
      <td className="p-4 w-20 text-center font-bold align-top">
        {masterMessage.order}
      </td>
      <td className="p-4 align-top">
        <p className="font-bold text-white text-base">{masterMessage.message}</p>
      </td>
      <td className="p-4 align-top">
        {/* --- Start: UI Enhancement --- */}
        <TranslationStatusPopover
          group={group}
          allActiveLanguages={allActiveLanguages}
        />
        {/* --- End: UI Enhancement --- */}
      </td>
      <td className="p-4 align-middle text-sm text-center">
        <span
          className={`px-2 py-1 text-xs font-semibold rounded-full whitespace-nowrap ${
            masterMessage.isActive
              ? "bg-green-500/20 text-green-400"
              : "bg-yellow-500/20 text-yellow-400"
          }`}
        >
          {masterMessage.isActive ? "Active" : "Inactive"}
        </span>
      </td>
      <td className="p-4 align-middle text-center space-y-2">
        <button
          onClick={handleTranslateAll}
          disabled={translateMutation.isPending}
          className="w-full flex items-center justify-center gap-2 text-sm bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 font-semibold px-3 py-1.5 rounded-md transition-colors disabled:opacity-50 disabled:cursor-wait"
        >
          {translateMutation.isPending ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Languages size={16} />
          )}
          <span>Translate</span>
        </button>
        <button
          onClick={handleDeleteAll}
          className="text-gray-500 hover:text-red-400 transition-colors p-1"
          title="Delete entire translation group"
        >
          <Trash2 size={18} />
        </button>
      </td>
    </tr>
  );
}