// ===== src/components/admin/translations/TranslationRow.tsx =====

"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import toast from "react-hot-toast";
import { ITranslation } from "@/models/Translation";
import { ILanguage } from "@/models/Language";
import { Edit, Trash2, Loader2 } from "lucide-react";
import TranslationStatusPopover from "./TranslationStatusPopover";

interface TranslationRowProps {
  translation: ITranslation;
  languages: ILanguage[];
  onEdit: (translation: ITranslation) => void; // Callback to open the modal
}

export default function TranslationRow({
  translation,
  languages,
  onEdit,
}: TranslationRowProps) {
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      axios.delete("/api/admin/translations/manage", { data: { id } }),
    onSuccess: () => {
      toast.success("Translation key deleted!");
      queryClient.invalidateQueries({ queryKey: ["allTranslations"] });
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.error || "Deletion failed."),
  });

  const handleDelete = () => {
    if (
      window.confirm(
        `Are you sure you want to delete the key "${translation.key}" and all its translations?`
      )
    ) {
      deleteMutation.mutate(translation._id as string);
    }
  };

  const englishTranslation =
    translation.translations["en" as keyof typeof translation.translations] ||
    "N/A";

  return (
    <tr className="border-t border-gray-700/50 group">
      <td className="p-4 align-top">
        <p className="font-mono text-sm font-bold text-white">
          {translation.key}
        </p>
        <p className="text-xs text-brand-muted">{translation.group}</p>
      </td>
      <td className="p-4 align-top" colSpan={1}>
        <p className="text-sm text-text-secondary whitespace-pre-wrap">
          {englishTranslation}
        </p>
      </td>
      <td className="p-4 align-top">
        <TranslationStatusPopover
          translation={translation}
          allActiveLanguages={languages}
        />
      </td>
      <td className="p-4 align-middle text-center">
        <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(translation)}
            className="p-2 text-blue-400 hover:bg-gray-700 rounded-full"
            title="Edit Translations"
          >
            <Edit size={18} />
          </button>
          <button
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="p-2 text-red-400 hover:bg-gray-700 rounded-full disabled:opacity-50"
            title="Delete Key"
          >
            {deleteMutation.isPending ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Trash2 size={18} />
            )}
          </button>
        </div>
      </td>
    </tr>
  );
}
