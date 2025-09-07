// ===== src/app/admin/(protected)/seo-overrides/page.tsx =====

"use client";

import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import toast from "react-hot-toast";
import {
  FilePenLine,
  Loader2,
  Save,
  Sparkles,
  RefreshCw,
  Trash2,
} from "lucide-react";
import Select, { StylesConfig } from "react-select"; // MODIFIED: Imported StylesConfig
import RichTextEditor from "@/components/admin/RichTextEditor";
import { ILanguage } from "@/models/Language";

// --- Data Fetching Functions ---
const fetchLanguages = async (): Promise<ILanguage[]> => {
  const { data } = await axios.get("/api/admin/languages?active=true");
  return data;
};

const fetchLeagues = async (): Promise<{ value: string; label: string }[]> => {
  const { data } = await axios.get(
    "/api/directory/standings-leagues?limit=10000"
  );
  return data.leagues.map((l: any) => ({
    value: l.id.toString(),
    label: l.name,
  }));
};

const fetchOverrideData = async (entityType: string, entityId: string) => {
  if (!entityType || !entityId) return {};
  const { data } = await axios.get(
    `/api/admin/seo-overrides?entityType=${entityType}&entityId=${entityId}`
  );
  return data;
};

const PAGE_TYPES = [{ value: "league-standings", label: "League Standings" }];

// ADDED: Custom styles object for the react-select component
const customSelectStyles: StylesConfig = {
  control: (provided) => ({
    ...provided,
    backgroundColor: "#1F1D2B", // --brand-dark
    borderColor: "#4A5568", // gray-600
    minHeight: "42px",
  }),
  singleValue: (provided) => ({
    ...provided,
    color: "white",
  }),
  menu: (provided) => ({
    ...provided,
    backgroundColor: "#252837", // --brand-secondary
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isSelected
      ? "rgba(139, 92, 246, 0.5)"
      : state.isFocused
      ? "#8b5cf6"
      : "transparent",
    ":active": {
      ...provided[":active"],
      backgroundColor: "rgba(139, 92, 246, 0.7)",
    },
  }),
  input: (provided) => ({
    ...provided,
    color: "#E0E0E0",
  }),
  indicatorSeparator: (provided) => ({
    ...provided,
    backgroundColor: "#4A5568",
  }),
  placeholder: (provided) => ({
    ...provided,
    color: "#9E9E9E",
  }),
};

export default function SeoOverridesPage() {
  const queryClient = useQueryClient();

  // --- State Management ---
  const [selectedPageType, setSelectedPageType] = useState(PAGE_TYPES[0].value);
  const [selectedEntity, setSelectedEntity] = useState<{
    value: string;
    label: string;
  } | null>(null);
  const [activeLang, setActiveLang] = useState("en");

  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [seoText, setSeoText] = useState("");

  // --- Data Fetching ---
  const { data: languages = [] } = useQuery<ILanguage[]>({
    queryKey: ["activeLanguages"],
    queryFn: fetchLanguages,
  });
  const { data: leagues = [], isLoading: isLoadingLeagues } = useQuery<
    { value: string; label: string }[]
  >({ queryKey: ["allLeaguesForSelect"], queryFn: fetchLeagues });

  const {
    data: overrideData,
    isLoading: isLoadingOverrides,
    refetch: refetchOverrides,
  } = useQuery({
    queryKey: ["seoOverride", selectedPageType, selectedEntity?.value],
    queryFn: () => fetchOverrideData(selectedPageType, selectedEntity!.value),
    enabled: !!selectedEntity,
    refetchOnWindowFocus: false,
  });

  // --- Mutations ---
  const saveMutation = useMutation({
    mutationFn: (payload: any) =>
      axios.post("/api/admin/seo-overrides", payload),
    onSuccess: (data, variables) => {
      toast.success(
        `Override for ${variables.language.toUpperCase()} saved successfully!`
      );
      queryClient.setQueryData(
        ["seoOverride", selectedPageType, selectedEntity?.value],
        (oldData: any) => ({
          ...oldData,
          [variables.language]: data.data,
        })
      );
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.error || "Failed to save override."),
  });

  const translateMutation = useMutation({
    mutationFn: (payload: any) =>
      axios.post("/api/admin/seo-overrides/translate", payload),
    onSuccess: (data) => {
      const { translations } = data.data;
      queryClient.setQueryData(
        ["seoOverride", selectedPageType, selectedEntity?.value],
        (oldData: any) => {
          const newData = { ...oldData };
          for (const langCode in translations) {
            newData[langCode] = translations[langCode];
          }
          return newData;
        }
      );
      toast.success(
        "Content translated. Please review and save each language."
      );
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.error || "Translation failed."),
  });

  const deleteMutation = useMutation({
    mutationFn: (payload: {
      entityType: string;
      entityId: string;
      language?: string;
    }) => axios.post("/api/admin/seo-overrides/delete", payload),
    onSuccess: (response) => {
      toast.success(response.data.message);
      refetchOverrides();
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.error || "Deletion failed."),
  });

  // --- UI Logic & Effects ---
  useEffect(() => {
    const currentLangData = overrideData?.[activeLang] || {};
    setMetaTitle(currentLangData.metaTitle || "");
    setMetaDescription(currentLangData.metaDescription || "");
    setSeoText(currentLangData.seoText || "");
  }, [activeLang, overrideData]);

  const handleEntitySelect = (option: any) => {
    setSelectedEntity(option);
    setActiveLang("en");
  };

  const englishContent = useMemo(() => {
    return (
      overrideData?.["en"] || {
        metaTitle: "",
        metaDescription: "",
        seoText: "",
      }
    );
  }, [overrideData]);

  // --- Event Handlers ---
  const handleSave = () => {
    if (!selectedEntity) return;
    saveMutation.mutate({
      entityType: selectedPageType,
      entityId: selectedEntity.value,
      language: activeLang,
      metaTitle,
      metaDescription,
      seoText,
    });
  };

  const handleAutoTranslate = () => {
    if (
      !englishContent.metaTitle &&
      !englishContent.metaDescription &&
      !englishContent.seoText
    ) {
      toast.error(
        "Please create and save the English content before translating."
      );
      return;
    }
    const targetLangs = languages.filter((lang) => lang.code !== "en");
    if (targetLangs.length === 0) {
      toast.error("No other active languages to translate to.");
      return;
    }
    translateMutation.mutate({
      sourceContent: englishContent,
      sourceLang: "English",
      targetLangs,
    });
  };

  const handleDeleteLanguage = () => {
    if (!selectedEntity || !activeLang) return;
    if (
      window.confirm(
        `Are you sure you want to delete the override for ${activeLang.toUpperCase()}? This will revert this language to its default content.`
      )
    ) {
      deleteMutation.mutate({
        entityType: selectedPageType,
        entityId: selectedEntity.value,
        language: activeLang,
      });
    }
  };

  const handleDeleteAll = () => {
    if (!selectedEntity) return;
    if (
      window.confirm(
        `Are you sure you want to delete ALL overrides for ${selectedEntity.label}? This will revert all languages to default content.`
      )
    ) {
      deleteMutation.mutate({
        entityType: selectedPageType,
        entityId: selectedEntity.value,
      });
    }
  };

  const isDataPresentForActiveLang = !!overrideData?.[activeLang];
  const isBusy =
    saveMutation.isPending ||
    translateMutation.isPending ||
    deleteMutation.isPending;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-4 justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white flex items-center gap-2">
          <FilePenLine size={28} /> SEO Overrides
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-brand-secondary p-4 rounded-lg">
          <label className="block text-sm font-medium text-brand-light mb-2">
            1. Select Page Type
          </label>
          <Select
            options={PAGE_TYPES}
            defaultValue={PAGE_TYPES[0]}
            onChange={(opt: any) => setSelectedPageType(opt.value)}
            styles={customSelectStyles} // ADDED
            menuPortalTarget={
              typeof window !== "undefined" ? document.body : null
            }
          />
        </div>
        <div className="bg-brand-secondary p-4 rounded-lg">
          <label className="block text-sm font-medium text-brand-light mb-2">
            2. Select a League to Edit
          </label>
          <Select
            options={leagues}
            value={selectedEntity}
            onChange={handleEntitySelect}
            isLoading={isLoadingLeagues}
            placeholder="Search for a league..."
            isClearable
            styles={customSelectStyles} // ADDED
            menuPortalTarget={
              typeof window !== "undefined" ? document.body : null
            }
          />
        </div>
      </div>

      {selectedEntity && (
        <div className="bg-brand-secondary rounded-lg">
          <div className="p-4 border-b border-gray-700/50 flex flex-wrap gap-4 justify-between items-center">
            <h2 className="text-xl font-bold">
              Editing:{" "}
              <span className="text-brand-purple">{selectedEntity.label}</span>
            </h2>
            <button
              onClick={handleDeleteAll}
              disabled={isBusy}
              className="flex items-center gap-2 text-xs bg-red-800 text-white font-semibold py-2 px-3 rounded-md hover:bg-red-700 disabled:opacity-50"
            >
              {deleteMutation.isLoading &&
              !deleteMutation.variables?.language ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Trash2 size={14} />
              )}
              Delete All Overrides
            </button>
          </div>

          <div className="border-b border-gray-700">
            <nav className="-mb-px flex space-x-4 px-4" aria-label="Tabs">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => setActiveLang(lang.code)}
                  className={`relative whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors
                                ${
                                  activeLang === lang.code
                                    ? "border-[var(--brand-accent)] text-[var(--brand-accent)]"
                                    : "border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500"
                                }`}
                >
                  {lang.name}
                  {overrideData?.[lang.code] && (
                    <span className="absolute top-2 -right-1 block h-2 w-2 rounded-full bg-green-400 ring-2 ring-brand-secondary" />
                  )}
                </button>
              ))}
            </nav>
          </div>

          {isLoadingOverrides ? (
            <div className="p-6 text-center text-brand-muted">
              <Loader2 className="animate-spin inline-block mr-2" />
              Loading content...
            </div>
          ) : (
            <div className="p-6 space-y-6">
              <div>
                <label
                  htmlFor="metaTitle"
                  className="block text-sm font-medium text-brand-light mb-1"
                >
                  Meta Title
                </label>
                <input
                  id="metaTitle"
                  value={metaTitle}
                  onChange={(e) => setMetaTitle(e.target.value)}
                  className="w-full p-2 bg-brand-dark rounded-md border border-gray-600"
                />
                <p className="text-xs text-brand-muted mt-1">
                  {metaTitle.length} / 60 characters
                </p>
              </div>
              <div>
                <label
                  htmlFor="metaDescription"
                  className="block text-sm font-medium text-brand-light mb-1"
                >
                  Meta Description
                </label>
                <textarea
                  id="metaDescription"
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  rows={3}
                  className="w-full p-2 bg-brand-dark rounded-md border border-gray-600 resize-y"
                />
                <p className="text-xs text-brand-muted mt-1">
                  {metaDescription.length} / 160 characters
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-light mb-1">
                  SEO Text Content
                </label>
                <RichTextEditor value={seoText} onChange={setSeoText} />
              </div>

              <div className="flex justify-end items-center gap-4 pt-4 border-t border-gray-700/50">
                {isDataPresentForActiveLang && (
                  <button
                    onClick={handleDeleteLanguage}
                    disabled={isBusy}
                    className="flex items-center gap-2 text-xs text-red-400 font-semibold py-2 px-3 rounded-md hover:bg-red-500/20 disabled:opacity-50 mr-auto"
                  >
                    {deleteMutation.isLoading &&
                    deleteMutation.variables?.language === activeLang ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Trash2 size={14} />
                    )}
                    Delete for {activeLang.toUpperCase()}
                  </button>
                )}
                {activeLang === "en" && (
                  <button
                    onClick={handleAutoTranslate}
                    disabled={isBusy}
                    className="flex items-center gap-2 text-xs bg-indigo-600 text-white font-semibold py-2 px-3 rounded-md hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {translateMutation.isPending ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Sparkles size={14} />
                    )}
                    Translate to All Others
                  </button>
                )}
                <button
                  onClick={handleSave}
                  disabled={isBusy}
                  className="flex items-center gap-2 bg-brand-purple text-white font-bold py-2 px-4 rounded-lg hover:opacity-90 disabled:opacity-50"
                >
                  {saveMutation.isPending ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Save size={18} />
                  )}
                  Save for {activeLang.toUpperCase()}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
