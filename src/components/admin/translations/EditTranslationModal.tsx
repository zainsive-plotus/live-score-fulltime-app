// ===== src/components/admin/translations/EditTranslationModal.tsx =====

"use client";

import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import toast from "react-hot-toast";
import { ILanguage } from "@/models/Language";
import { ITranslation } from "@/models/Translation";
import { XCircle, Save, Sparkles, Loader2, Info } from "lucide-react";

interface EditTranslationModalProps {
  isOpen: boolean;
  onClose: () => void;
  translation: ITranslation;
  languages: ILanguage[];
}

export default function EditTranslationModal({
  isOpen,
  onClose,
  translation,
  languages,
}: EditTranslationModalProps) {
  const queryClient = useQueryClient();
  const [editData, setEditData] = useState<ITranslation>(translation);

  useEffect(() => {
    // When the modal is opened with a new translation, reset the state
    setEditData(JSON.parse(JSON.stringify(translation)));
  }, [translation, isOpen]);

  const updateMutation = useMutation({
    mutationFn: (updatedData: ITranslation) =>
      axios.put("/api/admin/translations/manage", updatedData),
    onSuccess: (data) => {
      toast.success("Translation updated successfully!");
      queryClient.setQueryData(
        ["allTranslations"],
        (oldData: ITranslation[] | undefined) =>
          oldData?.map((t) => (t._id === data.data._id ? data.data : t))
      );
      onClose();
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.error || "Update failed."),
  });

  const aiTranslateMutation = useMutation({
    mutationFn: (payload: { text: string; targetLangCodes: string[] }) =>
      axios.post("/api/admin/translations/ai-translate", payload),
    onSuccess: (data) => {
      setEditData((prev) => ({
        ...prev,
        translations: { ...prev.translations, ...data.data },
      }));
      toast.success("AI translation complete!");
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.error || "AI translation failed."),
  });

  const handleEditChange = (langCode: string, value: string) => {
    setEditData((prev) => ({
      ...prev,
      translations: {
        ...prev.translations,
        [langCode]: value,
      },
    }));
  };

  const handleAiTranslate = () => {
    const englishText =
      editData.translations["en" as keyof typeof editData.translations];
    if (!englishText) {
      toast.error(
        "Please provide the English text to use as a source for translation."
      );
      return;
    }
    const targetLangs = languages
      .filter(
        (l) =>
          l.code !== "en" &&
          !editData.translations[l.code as keyof typeof editData.translations]
      )
      .map((l) => l.code);
    if (targetLangs.length === 0) {
      toast.success("All languages are already translated!");
      return;
    }
    aiTranslateMutation.mutate({
      text: englishText,
      targetLangCodes: targetLangs,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(editData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-brand-secondary rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-gray-700 flex-shrink-0">
          <div>
            <h2 className="text-2xl font-bold text-white">
              Edit Translation Key
            </h2>
            <p className="font-mono text-sm text-brand-purple mt-1">
              {translation.key}
            </p>
          </div>
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
              Group
            </label>
            <input
              type="text"
              value={editData.group}
              onChange={(e) =>
                setEditData((prev) => ({ ...prev, group: e.target.value }))
              }
              className="w-full md:w-1/2 p-2 rounded bg-gray-700 text-white border border-gray-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-brand-light mb-1">
              Description (Optional)
            </label>
            <input
              type="text"
              value={editData.description}
              onChange={(e) =>
                setEditData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600"
            />
          </div>

          <div className="pt-4 border-t border-gray-700">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-semibold text-white">Translations</h3>
              <button
                type="button"
                onClick={handleAiTranslate}
                disabled={aiTranslateMutation.isPending}
                className="flex items-center gap-2 bg-indigo-600 text-white font-bold py-2 px-3 rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50"
              >
                {aiTranslateMutation.isPending ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Sparkles size={16} />
                )}
                <span>Auto-translate Missing</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {languages.map((lang) => (
                <div key={lang.code}>
                  <label className="block text-sm font-medium text-brand-light mb-1">
                    {lang.name}
                  </label>
                  <textarea
                    value={
                      editData.translations[
                        lang.code as keyof typeof editData.translations
                      ] || ""
                    }
                    onChange={(e) =>
                      handleEditChange(lang.code, e.target.value)
                    }
                    className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600 resize-y"
                    rows={3}
                  />
                </div>
              ))}
            </div>
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
            className="bg-brand-purple text-white font-bold py-2 px-4 rounded-lg disabled:opacity-50 flex items-center gap-2"
            disabled={updateMutation.isPending || aiTranslateMutation.isPending}
          >
            {updateMutation.isPending ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Save size={18} />
            )}
            {updateMutation.isPending ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
