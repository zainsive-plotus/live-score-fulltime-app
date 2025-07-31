// ===== src/app/admin/translations/page.tsx =====

"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { ITranslation } from "@/models/Translation";
import { ILanguage } from "@/models/Language";
import { FileJson, PlusCircle } from "lucide-react";
import TranslationsTable from "@/components/admin/translations/TranslationsTable";
import AddTranslationModal from "@/components/admin/translations/AddTranslationModal";

const fetchTranslations = async (): Promise<ITranslation[]> => {
  const { data } = await axios.get("/api/admin/translations/manage");
  return data;
};

const fetchActiveLanguages = async (): Promise<ILanguage[]> => {
  const { data } = await axios.get("/api/admin/languages?active=true");
  return data;
};

export default function AdminTranslationsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [groupFilter, setGroupFilter] = useState("all");

  const {
    data: translations,
    isLoading: isLoadingTranslations,
    error: translationsError,
  } = useQuery<ITranslation[]>({
    queryKey: ["allTranslations"],
    queryFn: fetchTranslations,
  });

  const {
    data: languages,
    isLoading: isLoadingLanguages,
    error: languagesError,
  } = useQuery<ILanguage[]>({
    queryKey: ["activeLanguages"],
    queryFn: fetchActiveLanguages,
  });

  const translationGroups = [
    "all",
    ...new Set(translations?.map((t) => t.group) || []),
  ];

  const filteredTranslations = translations?.filter((t) => {
    const matchesGroup = groupFilter === "all" || t.group === groupFilter;
    const matchesSearch =
      searchTerm.length === 0 ||
      t.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
      Object.values(t.translations).some((val) =>
        val.toLowerCase().includes(searchTerm.toLowerCase())
      );
    return matchesGroup && matchesSearch;
  });

  const isLoading = isLoadingTranslations || isLoadingLanguages;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white flex items-center gap-2">
          <FileJson size={28} /> Manage Translations
        </h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-brand-purple text-white font-bold py-2 px-4 rounded-lg hover:opacity-90"
        >
          <PlusCircle size={20} />
          New Key
        </button>
      </div>

      <div className="bg-brand-secondary p-4 rounded-lg mb-6 flex flex-col md:flex-row gap-4">
        <input
          type="text"
          placeholder="Search key or text..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-grow p-2 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-purple"
        />
        <select
          value={groupFilter}
          onChange={(e) => setGroupFilter(e.target.value)}
          className="p-2 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-purple"
        >
          {translationGroups.map((group) => (
            <option key={group} value={group}>
              {group.charAt(0).toUpperCase() + group.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-brand-secondary rounded-lg overflow-hidden">
        <TranslationsTable
          translations={filteredTranslations || []}
          languages={languages || []}
          isLoading={isLoading}
          error={translationsError || languagesError}
        />
      </div>

      {isModalOpen && (
        <AddTranslationModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          languages={languages || []}
          existingKeys={translations?.map((t) => t.key) || []}
        />
      )}
    </div>
  );
}
