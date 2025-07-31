// ===== src/components/admin/translations/TranslationRow.tsx =====

"use client";

import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import toast from "react-hot-toast";
import { ITranslation } from "@/models/Translation";
import { ILanguage } from "@/models/Language";
import { Edit, Save, Trash2, X, Loader2 } from "lucide-react";

interface TranslationRowProps {
  translation: ITranslation;
  languages: ILanguage[];
}

// Helper to ensure `translations` is treated as a plain object for state
const getInitialEditData = (translation: ITranslation) => {
  const plainObject = JSON.parse(JSON.stringify(translation));
  // Ensure translations property is a plain object, not a Map-like structure
  plainObject.translations = { ...plainObject.translations };
  return plainObject;
};

export default function TranslationRow({
  translation,
  languages,
}: TranslationRowProps) {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  // Use the helper to initialize state safely
  const [editData, setEditData] = useState<any>(() =>
    getInitialEditData(translation)
  );

  // Resync state if the original prop changes
  useEffect(() => {
    setEditData(getInitialEditData(translation));
  }, [translation]);

  const updateMutation = useMutation({
    mutationFn: (updatedData: any) =>
      axios.put("/api/admin/translations/manage", updatedData),
    onSuccess: (data) => {
      toast.success("Translation updated successfully!");
      queryClient.setQueryData(
        ["allTranslations"],
        (oldData: ITranslation[] | undefined) =>
          oldData?.map((t) => (t._id === data.data._id ? data.data : t))
      );
      setIsEditing(false);
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.error || "Update failed."),
  });

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

  const handleEditChange = (langCode: string, value: string) => {
    setEditData((prev: any) => ({
      ...prev,
      translations: {
        ...prev.translations,
        [langCode]: value,
      },
    }));
  };

  const handleGroupChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditData((prev: any) => ({ ...prev, group: e.target.value }));
  };

  const handleSave = () => {
    updateMutation.mutate(editData);
  };

  const handleCancel = () => {
    setEditData(getInitialEditData(translation));
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (
      window.confirm(
        `Are you sure you want to delete the key "${translation.key}" and all its translations?`
      )
    ) {
      deleteMutation.mutate(translation._id as string);
    }
  };

  return (
    <tr className="border-t border-gray-700/50 group">
      <td className="p-4 align-top">
        <p className="font-mono text-sm font-bold text-white">
          {translation.key}
        </p>
        {isEditing ? (
          <input
            type="text"
            value={editData.group}
            onChange={handleGroupChange}
            className="mt-1 p-1 text-xs rounded bg-gray-700 text-white border border-gray-600 w-full"
          />
        ) : (
          <p className="text-xs text-brand-muted">{translation.group}</p>
        )}
      </td>
      {languages.map((lang) => (
        <td key={lang.code} className="p-4 align-top">
          {isEditing ? (
            <textarea
              // ***** FIX HERE: Use object bracket notation *****
              value={editData.translations[lang.code] || ""}
              onChange={(e) => handleEditChange(lang.code, e.target.value)}
              className="w-full h-24 p-2 text-sm rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-purple resize-y"
              rows={3}
            />
          ) : (
            // ***** FIX HERE: Use object bracket notation *****
            <p className="text-sm text-text-secondary whitespace-pre-wrap">
              {translation.translations[
                lang.code as keyof typeof translation.translations
              ] || "N/A"}
            </p>
          )}
        </td>
      ))}
      <td className="p-4 align-top text-center">
        <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {isEditing ? (
            <>
              <button
                onClick={handleSave}
                disabled={updateMutation.isPending}
                className="p-2 text-green-400 hover:bg-gray-700 rounded-full disabled:opacity-50"
              >
                {updateMutation.isPending ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Save size={18} />
                )}
              </button>
              <button
                onClick={handleCancel}
                disabled={updateMutation.isPending}
                className="p-2 text-brand-muted hover:bg-gray-700 rounded-full disabled:opacity-50"
              >
                <X size={18} />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="p-2 text-blue-400 hover:bg-gray-700 rounded-full"
              >
                <Edit size={18} />
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="p-2 text-red-400 hover:bg-gray-700 rounded-full disabled:opacity-50"
              >
                {deleteMutation.isPending ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Trash2 size={18} />
                )}
              </button>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}
