// ===== src/components/admin/TranslationsWidget.tsx =====

"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import Link from "next/link";
import Image from "next/image";
import { Plus, Edit, Languages, Loader2 } from "lucide-react";
import { ILanguage } from "@/models/Language";
import { IPost } from "@/models/Post";

interface TranslationsWidgetProps {
  translationGroupId: string;
  currentPostLanguage: string;
  currentPostTitle: string;
}

interface TranslationPost {
  _id: string;
  title: string;
  language: string;
}

// Fetch all available languages
const fetchLanguages = async (): Promise<ILanguage[]> => {
  const { data } = await axios.get("/api/admin/languages");
  return data;
};

// Fetch all existing translations for the current article's group
const fetchTranslations = async (
  groupId: string
): Promise<TranslationPost[]> => {
  if (!groupId) return [];
  const { data } = await axios.get(`/api/admin/posts/translations/${groupId}`);
  return data;
};

export default function TranslationsWidget({
  translationGroupId,
  currentPostLanguage,
  currentPostTitle,
}: TranslationsWidgetProps) {
  const { data: languages, isLoading: isLoadingLanguages } = useQuery<
    ILanguage[]
  >({
    queryKey: ["allLanguages"],
    queryFn: fetchLanguages,
  });

  const { data: translations, isLoading: isLoadingTranslations } = useQuery<
    TranslationPost[]
  >({
    queryKey: ["translations", translationGroupId],
    queryFn: () => fetchTranslations(translationGroupId),
    enabled: !!translationGroupId,
  });

  const languageMap = new Map(languages?.map((lang) => [lang.code, lang]));
  const existingTranslationsMap = new Map(
    translations?.map((t) => [t.language, t])
  );

  const isLoading = isLoadingLanguages || isLoadingTranslations;

  return (
    <div className="bg-gray-800 p-4 border border-gray-600 rounded-lg space-y-4">
      <h3 className="text-lg font-semibold text-white flex items-center gap-2">
        <Languages size={20} /> Translations
      </h3>
      {isLoading ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="animate-spin text-brand-muted" />
        </div>
      ) : (
        <div className="space-y-3">
          {languages
            ?.filter((l) => l.isActive)
            .map((lang) => {
              const translation = existingTranslationsMap.get(lang.code);
              const isCurrent = lang.code === currentPostLanguage;

              return (
                <div
                  key={lang.code}
                  className="flex items-center justify-between p-3 bg-brand-secondary rounded-md"
                >
                  <div className="flex items-center gap-3">
                    {lang.flagUrl && (
                      <Image
                        src={lang.flagUrl}
                        alt={lang.name}
                        width={24}
                        height={18}
                      />
                    )}
                    <span className="font-semibold text-brand-light">
                      {lang.name}
                    </span>
                    {isCurrent && (
                      <span className="text-xs bg-brand-purple text-white px-2 py-0.5 rounded-full">
                        Current
                      </span>
                    )}
                  </div>

                  {translation ? (
                    <Link
                      href={`/admin/news/edit/${translation._id}`}
                      className="flex items-center gap-1.5 text-sm text-blue-400 hover:text-blue-300"
                    >
                      <Edit size={14} /> Edit
                    </Link>
                  ) : (
                    <Link
                      href={{
                        pathname: "/admin/news/create",
                        query: {
                          from: translationGroupId,
                          lang: lang.code,
                          title: `Translation of: ${currentPostTitle}`,
                        },
                      }}
                      className="flex items-center gap-1.5 text-sm text-green-400 hover:text-green-300"
                    >
                      <Plus size={14} /> Add Translation
                    </Link>
                  )}
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}
