// ===== src/app/admin/(protected)/languages/page.tsx =====

"use client";

import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import toast from "react-hot-toast";
import { ILanguage } from "@/models/Language";
import {
  PlusCircle,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Loader2,
  Languages,
  Save,
  FileJson,
  UploadCloud,
  RefreshCw, // ADDED: Icon for the new button
} from "lucide-react";
import Image from "next/image";

interface LanguageFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  language?: ILanguage | null;
  onSave: () => void;
}

const LanguageFormModal: React.FC<LanguageFormModalProps> = ({
  isOpen,
  onClose,
  language,
  onSave,
}) => {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [flagUrl, setFlagUrl] = useState<string | undefined>(undefined);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (language) {
      setName(language.name);
      setCode(language.code);
      setIsActive(language.isActive);
      setFlagUrl(language.flagUrl);
    } else {
      setName("");
      setCode("");
      setIsActive(true);
      setFlagUrl(undefined);
    }
  }, [language]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const { data } = await axios.post("/api/upload", formData);
      setFlagUrl(data.url);
      toast.success("Flag uploaded successfully!");
    } catch (error) {
      toast.error("Flag upload failed. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const mutation = useMutation({
    mutationFn: (payload: Partial<ILanguage>) =>
      language?._id
        ? axios.put(`/api/admin/languages/${language._id}`, payload)
        : axios.post("/api/admin/languages", payload),
    onSuccess: () => {
      toast.success(
        `Language ${language ? "updated" : "created"} successfully!`
      );
      onSave();
      onClose();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Failed to save language.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({ name, code, isActive, flagUrl });
  };

  const isMutationPending = mutation.isPending || isUploading;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-brand-secondary rounded-lg shadow-xl w-full max-w-lg">
        <div className="flex justify-between items-center p-6 border-b border-gray-700">
          <h2 className="text-2xl font-bold text-white">
            {language ? "Edit Language" : "Add New Language"}
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
              Language Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-3 rounded bg-gray-700 text-white"
              required
              disabled={isMutationPending}
              placeholder="e.g., German"
            />
          </div>
          <div>
            <label
              htmlFor="code"
              className="block text-sm font-medium text-brand-light mb-1"
            >
              Language Code (ISO 639-1)
            </label>
            <input
              id="code"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full p-3 rounded bg-gray-700 text-white"
              required
              disabled={isMutationPending || !!language}
              placeholder="e.g., de"
            />
            {!!language && (
              <p className="text-xs text-brand-muted mt-1">
                Language code cannot be changed after creation.
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-brand-light mb-1">
              Flag Image (Optional)
            </label>
            <div className="mt-2 flex items-center gap-4">
              <div className="w-16 h-12 flex-shrink-0 bg-gray-700 rounded-md flex items-center justify-center">
                {flagUrl ? (
                  <Image
                    src={flagUrl}
                    alt="Flag preview"
                    width={48}
                    height={32}
                    objectFit="contain"
                  />
                ) : (
                  <UploadCloud className="w-8 h-8 text-gray-500" />
                )}
              </div>
              <label
                htmlFor="flag-upload"
                className="relative cursor-pointer bg-gray-600 py-2 px-3 border border-gray-500 rounded-md shadow-sm text-sm leading-4 font-medium text-white hover:bg-gray-700"
              >
                <span>{isUploading ? "Uploading..." : "Upload File"}</span>
                <input
                  id="flag-upload"
                  name="flag-upload"
                  type="file"
                  className="sr-only"
                  onChange={handleImageUpload}
                  disabled={isUploading}
                  accept="image/png, image/jpeg, image/svg+xml, image/webp"
                />
              </label>
            </div>
          </div>
          <div className="flex items-center">
            <input
              id="isActive"
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 text-brand-purple bg-gray-700 border-gray-600 rounded"
              disabled={isMutationPending}
            />
            <label
              htmlFor="isActive"
              className="ml-2 text-sm font-medium text-brand-light"
            >
              Active (Visible on site)
            </label>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-600 text-white font-bold py-2 px-4 rounded-lg hover:opacity-90"
              disabled={isMutationPending}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-brand-purple text-white font-bold py-2 px-4 rounded-lg disabled:opacity-50 flex items-center gap-2"
              disabled={isMutationPending}
            >
              {isMutationPending ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <CheckCircle size={18} />
              )}
              {isUploading
                ? "Uploading..."
                : mutation.isPending
                ? "Saving..."
                : "Save Language"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default function AdminLanguagesPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLanguage, setEditingLanguage] = useState<ILanguage | null>(
    null
  );
  const [selectedLocale, setSelectedLocale] = useState("");
  const [translationContent, setTranslationContent] = useState("");

  const { data: languages = [], isLoading: isLoadingLanguages } = useQuery<
    ILanguage[]
  >({
    queryKey: ["languages"],
    queryFn: () => axios.get("/api/admin/languages").then((res) => res.data),
  });

  const { data: defaultLanguageFileContent, isLoading: isLoadingDefaultFile } =
    useQuery<string>({
      queryKey: ["translations", "tr"],
      queryFn: () =>
        axios
          .get("/api/admin/translations?locale=tr")
          .then((res) => JSON.stringify(res.data, null, 2)),
      enabled: true,
      staleTime: Infinity,
    });

  const { refetch: fetchTranslationFile, isFetching: isFetchingFile } =
    useQuery({
      queryKey: ["translations", selectedLocale],
      queryFn: () =>
        axios
          .get(`/api/admin/translations?locale=${selectedLocale}`)
          .then((res) => JSON.stringify(res.data, null, 2)),
      enabled: false,
      onSuccess: (data) => setTranslationContent(data),
      onError: () =>
        toast.error(`Could not load translations for ${selectedLocale}.`),
    });

  // ADDED: Mutation to call the cache invalidation endpoint
  const invalidateCacheMutation = useMutation({
    mutationFn: () => axios.post("/api/admin/i18n-cache/invalidate"),
    onSuccess: (data) => {
      toast.success(
        data.data.message || "Translation cache flushed successfully!"
      );
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Failed to flush cache.");
    },
  });

  useEffect(() => {
    if (selectedLocale) {
      fetchTranslationFile();
    } else {
      setTranslationContent("");
    }
  }, [selectedLocale, fetchTranslationFile]);

  const updateLanguageMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Partial<ILanguage>;
    }) => axios.put(`/api/admin/languages/${id}`, payload),
    onSuccess: () => {
      toast.success("Language status updated!");
      queryClient.invalidateQueries({ queryKey: ["languages"] });
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.error || "Update failed."),
  });

  const deleteLanguageMutation = useMutation({
    mutationFn: (id: string) => axios.delete(`/api/admin/languages/${id}`),
    onSuccess: () => {
      toast.success("Language deleted!");
      queryClient.invalidateQueries({ queryKey: ["languages"] });
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.error || "Deletion failed."),
  });

  const saveTranslationsMutation = useMutation({
    mutationFn: ({ locale, content }: { locale: string; content: string }) =>
      axios.post("/api/admin/translations", { locale, content }),
    onSuccess: () =>
      toast.success(`Translations for '${selectedLocale}' saved!`),
    onError: (err: any) =>
      toast.error(
        err.response?.data?.error || "Save failed. Check JSON format."
      ),
  });

  const handleOpenEditModal = (lang: ILanguage) => {
    setEditingLanguage(lang);
    setIsModalOpen(true);
  };

  const handleDelete = (lang: ILanguage) => {
    if (
      window.confirm(
        `Are you sure you want to delete "${lang.name}"? This will also delete its translation file and cannot be undone.`
      )
    ) {
      deleteLanguageMutation.mutate(lang._id);
    }
  };

  const handleSetDefault = (langId: string) => {
    updateLanguageMutation.mutate({ id: langId, payload: { isDefault: true } });
  };

  const handleSaveTranslations = () => {
    if (!selectedLocale) return;
    saveTranslationsMutation.mutate({
      locale: selectedLocale,
      content: translationContent,
    });
  };

  // ADDED: Handler for the new button
  const handleFlushCache = () => {
    if (
      window.confirm(
        "This will reload all translations from the database, which may take a moment. Are you sure you want to flush the cache?"
      )
    ) {
      invalidateCacheMutation.mutate();
    }
  };

  const activeLanguages = useMemo(
    () => languages.filter((l) => l.isActive),
    [languages]
  );

  return (
    <div>
      <div className="flex flex-wrap gap-4 justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white flex items-center gap-2">
          <Languages size={28} /> Manage Languages
        </h1>
        <div className="flex items-center gap-2">
          {/* ADDED: The new button for flushing the cache */}
          <button
            onClick={handleFlushCache}
            disabled={invalidateCacheMutation.isPending}
            className="flex items-center gap-2 bg-amber-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-amber-700 disabled:opacity-50"
          >
            {invalidateCacheMutation.isPending ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <RefreshCw size={20} />
            )}
            <span>Reload Translations</span>
          </button>
          <button
            onClick={() => {
              setEditingLanguage(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 bg-brand-purple text-white font-bold py-2 px-4 rounded-lg hover:opacity-90"
          >
            <PlusCircle size={20} /> New Language
          </button>
        </div>
      </div>

      <div className="bg-brand-secondary rounded-lg overflow-x-auto mb-8">
        <table className="w-full text-left text-brand-light">
          <thead className="bg-gray-800/50 text-sm text-brand-muted uppercase">
            <tr>
              <th className="p-4">Language</th>
              <th className="p-4">Code</th>
              <th className="p-4">Status</th>
              <th className="p-4">Default</th>
              <th className="p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoadingLanguages ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-brand-muted">
                  Loading languages...
                </td>
              </tr>
            ) : (
              languages.map((lang) => (
                <tr key={lang._id} className="border-t border-gray-700/50">
                  <td className="p-4 font-medium">{lang.name}</td>
                  <td className="p-4 text-brand-muted">{lang.code}</td>
                  <td className="p-4">
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        lang.isActive
                          ? "bg-green-500/20 text-green-400"
                          : "bg-red-500/20 text-red-400"
                      }`}
                    >
                      {lang.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="p-4">
                    {lang.isDefault ? (
                      <span className="font-bold text-green-400">Yes</span>
                    ) : (
                      <button
                        onClick={() => handleSetDefault(lang._id)}
                        className="text-xs text-brand-muted hover:text-white"
                        disabled={updateLanguageMutation.isPending}
                      >
                        Set
                      </button>
                    )}
                  </td>
                  <td className="p-4 flex gap-3 items-center h-full">
                    <button
                      onClick={() => handleOpenEditModal(lang)}
                      className="text-blue-400 hover:text-blue-300"
                      title="Edit"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(lang)}
                      className="text-red-400 hover:text-red-300"
                      title="Delete"
                      disabled={lang.isDefault}
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="bg-brand-secondary rounded-lg p-6">
        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
          <FileJson size={24} /> Translation Editor
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-brand-light mb-2">
              1. Select a language to edit
            </label>
            <select
              value={selectedLocale}
              onChange={(e) => setSelectedLocale(e.target.value)}
              className="w-full p-3 rounded bg-gray-700 text-white border-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-purple"
            >
              <option value="">-- Select --</option>
              {activeLanguages.map((l) => (
                <option key={l._id} value={l.code}>
                  {l.name} ({l.code})
                </option>
              ))}
            </select>
            <div className="mt-4">
              <label className="block text-sm font-medium text-brand-light mb-2">
                2. Edit JSON content
              </label>
              <textarea
                value={translationContent}
                onChange={(e) => setTranslationContent(e.target.value)}
                className="w-full h-96 p-3 font-mono text-sm rounded bg-gray-800 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-purple resize-y"
                disabled={!selectedLocale || isFetchingFile}
                placeholder={
                  isFetchingFile
                    ? "Loading..."
                    : "Select a language to load translations."
                }
              />
            </div>
            <button
              onClick={handleSaveTranslations}
              className="mt-4 flex items-center gap-2 bg-brand-purple text-white font-bold py-2 px-4 rounded-lg hover:opacity-90"
              disabled={!selectedLocale || saveTranslationsMutation.isPending}
            >
              {saveTranslationsMutation.isPending ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <Save size={18} />
              )}
              Save "{selectedLocale}" Translations
            </button>
          </div>
          <div>
            <label className="block text-sm font-medium text-brand-light mb-2">
              Default Keys Reference (Turkish - read-only)
            </label>
            <textarea
              value={defaultLanguageFileContent || ""}
              readOnly
              className="w-full h-[540px] p-3 font-mono text-sm rounded bg-gray-800/50 text-brand-muted border border-gray-700 resize-none"
              placeholder={
                isLoadingDefaultFile
                  ? "Loading default keys..."
                  : "Default keys could not be loaded."
              }
            />
          </div>
        </div>
      </div>

      <LanguageFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        language={editingLanguage}
        onSave={() =>
          queryClient.invalidateQueries({ queryKey: ["languages"] })
        }
      />
    </div>
  );
}
