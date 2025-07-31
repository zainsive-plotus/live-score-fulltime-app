// ===== src/components/admin/translations/AddTranslationModal.tsx =====

"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import toast from "react-hot-toast";
import { ILanguage } from "@/models/Language";
import { XCircle, Save, Sparkles, Loader2, Info } from "lucide-react";

interface AddTranslationModalProps {
  isOpen: boolean;
  onClose: () => void;
  languages: ILanguage[];
  existingKeys: string[];
}

export default function AddTranslationModal({
  isOpen,
  onClose,
  languages,
  existingKeys,
}: AddTranslationModalProps) {
  const queryClient = useQueryClient();
  const [key, setKey] = useState("");
  const [group, setGroup] = useState("general");
  const [description, setDescription] = useState("");
  const [translations, setTranslations] = useState<{ [key: string]: string }>({
    en: "",
  });
  const [keyError, setKeyError] = useState("");

  const handleKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newKey = e.target.value;
    setKey(newKey);
    if (existingKeys.includes(newKey)) {
      setKeyError("This key already exists. Please choose a unique one.");
    } else if (!/^[a-z0-9_]+$/.test(newKey) && newKey.length > 0) {
      setKeyError(
        "Key can only contain lowercase letters, numbers, and underscores."
      );
    } else {
      setKeyError("");
    }
  };

  const createMutation = useMutation({
    mutationFn: (newTranslationData: any) =>
      axios.post("/api/admin/translations/manage", newTranslationData),
    onSuccess: () => {
      toast.success("New translation key created successfully!");
      queryClient.invalidateQueries({ queryKey: ["allTranslations"] });
      onClose();
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.error || "Creation failed."),
  });

  const aiTranslateMutation = useMutation({
    mutationFn: (payload: { text: string; targetLangCodes: string[] }) =>
      axios.post("/api/admin/translations/ai-translate", payload),
    onSuccess: (data) => {
      setTranslations((prev) => ({ ...prev, ...data.data }));
      toast.success("AI translation complete!");
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.error || "AI translation failed."),
  });

  const handleAiTranslate = () => {
    if (!translations["en"]) {
      toast.error(
        "Please provide the English text first to use as a source for translation."
      );
      return;
    }
    const targetLangs = languages
      .filter((l) => l.code !== "en")
      .map((l) => l.code);
    aiTranslateMutation.mutate({
      text: translations["en"],
      targetLangCodes: targetLangs,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (keyError || !key.trim() || !translations["en"].trim()) {
      toast.error(
        "Please fix errors before submitting. Key and English translation are required."
      );
      return;
    }

    const translationsMap = new Map(Object.entries(translations));
    createMutation.mutate({
      key,
      group,
      description,
      translations: Object.fromEntries(translationsMap),
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-brand-secondary rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-gray-700 flex-shrink-0">
          <h2 className="text-2xl font-bold text-white">
            Add New Translation Key
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-brand-light mb-1">
                Key
              </label>
              <input
                type="text"
                value={key}
                onChange={handleKeyChange}
                className={`w-full p-2 rounded bg-gray-700 text-white border ${
                  keyError ? "border-red-500" : "border-gray-600"
                }`}
                required
              />
              {keyError && (
                <p className="text-red-400 text-xs mt-1">{keyError}</p>
              )}
              {!keyError && (
                <p className="text-xs text-brand-muted mt-1">
                  e.g., "welcome_message". Lowercase, numbers, and underscores
                  only.
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-brand-light mb-1">
                Group
              </label>
              <input
                type="text"
                value={group}
                onChange={(e) => setGroup(e.target.value)}
                className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-brand-light mb-1">
              Description (Optional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Context for this key, e.g., 'Homepage greeting'"
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
                <span>Auto-translate All</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {languages.map((lang) => (
                <div key={lang.code}>
                  <label className="block text-sm font-medium text-brand-light mb-1">
                    {lang.name}
                  </label>
                  <textarea
                    value={translations[lang.code] || ""}
                    onChange={(e) =>
                      setTranslations((prev) => ({
                        ...prev,
                        [lang.code]: e.target.value,
                      }))
                    }
                    className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600 resize-y"
                    rows={2}
                    required={lang.code === "en"}
                  />
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 bg-indigo-500/10 border border-indigo-500/20 text-indigo-200 text-xs rounded-lg flex items-start gap-2">
              <Info size={16} className="flex-shrink-0 mt-0.5" />
              <p>
                The English (en) translation is required. It will be used as the
                source for the auto-translation feature.
              </p>
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
            disabled={createMutation.isPending || !!keyError || !key.trim()}
          >
            {createMutation.isPending ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Save size={18} />
            )}
            {createMutation.isPending ? "Saving..." : "Create Key"}
          </button>
        </div>
      </div>
    </div>
  );
}
