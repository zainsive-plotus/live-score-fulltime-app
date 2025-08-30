// ===== src/components/admin/seo-text/SeoContentRow.tsx =====

"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import toast from "react-hot-toast";
import { ISeoContent } from "@/models/SeoContent";
import { ILanguage } from "@/models/Language";
import { Languages, RefreshCw, Loader2, Trash2 } from "lucide-react";
import Image from "next/image";
import { Popover, Transition } from "@headlessui/react";
import { Fragment, useState } from "react";
import { DEFAULT_LOCALE } from "@/lib/i18n/config"; // ADDED

interface SeoContentRowProps {
  pageType: string;
  group: ISeoContent[];
  entityName: string;
  allActiveLanguages: ILanguage[];
}

const createExcerpt = (html: string, length: number = 60) => {
  if (!html) return "";
  const text = html.replace(/<[^>]+>/g, " ");
  if (text.length <= length) return text.trim();
  return text.substring(0, length).trim() + "...";
};

export default function SeoContentRow({
  pageType,
  group,
  entityName,
  allActiveLanguages,
}: SeoContentRowProps) {
  const queryClient = useQueryClient();
  const [hoveredLang, setHoveredLang] = useState<string | null>(null);
  const [regeneratingLang, setRegeneratingLang] = useState<string | null>(null);

  const existingTranslationsMap = new Map(group.map((p) => [p.language, p]));
  const translatedCount = existingTranslationsMap.size;
  const totalLanguages = allActiveLanguages.length;
  const primaryContent = group[0];

  const deleteMutation = useMutation({
    mutationFn: (payload: { pageType: string; entityId: string }) =>
      axios.post(`/api/admin/seo-runner/delete`, payload),
    onSuccess: (response) => {
      toast.success(response.data.message);
      queryClient.invalidateQueries({ queryKey: ["seoContent", pageType] });
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.error || "Deletion failed."),
  });

  // This mutation is now for the main button, specifically for the primary language
  const regeneratePrimaryMutation = useMutation({
    mutationFn: (payload: {
      pageType: string;
      entityId: string;
      language: string;
    }) => axios.post(`/api/admin/seo-runner/regenerate`, payload),
    onSuccess: (response) => {
      toast.success(response.data.message);
      queryClient.invalidateQueries({ queryKey: ["seoContent", pageType] });
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.error || "Regeneration failed."),
  });

  // A separate mutation for individual re-translations to manage loading state
  const regenerateSingleMutation = useMutation({
    mutationFn: (payload: {
      pageType: string;
      entityId: string;
      language: string;
    }) => {
      setRegeneratingLang(payload.language);
      return axios.post(`/api/admin/seo-runner/regenerate`, payload);
    },
    onSuccess: (response, variables) => {
      toast.success(response.data.message);
      queryClient.invalidateQueries({ queryKey: ["seoContent", pageType] });
    },
    onError: (err: any, variables) => {
      toast.error(
        err.response?.data?.error ||
          `Failed to regenerate for ${variables.language.toUpperCase()}.`
      );
    },
    onSettled: () => {
      setRegeneratingLang(null);
    },
  });

  const translateAllMutation = useMutation({
    mutationFn: (payload: { pageType: string; entityId: string }) =>
      axios.post(`/api/admin/seo-runner/translate-single`, payload),
    onSuccess: (response) => {
      toast.success(response.data.message);
      queryClient.invalidateQueries({ queryKey: ["seoContent", pageType] });
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.error || "Translation failed."),
  });

  const handleDelete = () => {
    if (
      window.confirm(
        `Are you sure you want to delete all SEO content for "${entityName}" in all languages? This cannot be undone.`
      )
    ) {
      deleteMutation.mutate({ pageType, entityId: primaryContent.entityId });
    }
  };

  const handleRegeneratePrimary = () => {
    if (
      window.confirm(
        `Are you sure you want to regenerate the SEO text for "${entityName}" in the primary language (${DEFAULT_LOCALE.toUpperCase()})? This will use the last saved master template.`
      )
    ) {
      regeneratePrimaryMutation.mutate({
        pageType,
        entityId: primaryContent.entityId,
        language: DEFAULT_LOCALE,
      });
    }
  };

  const handleRegenerateSingle = (languageCode: string) => {
    const isPrimary = languageCode === DEFAULT_LOCALE;
    const message = isPrimary
      ? `Are you sure you want to regenerate the primary content for "${entityName}"?`
      : `Are you sure you want to re-translate the content for "${entityName}" into this language? This will overwrite the existing translation.`;
    if (window.confirm(message)) {
      regenerateSingleMutation.mutate({
        pageType,
        entityId: primaryContent.entityId,
        language: languageCode,
      });
    }
  };

  const handleTranslateAll = () => {
    // MODIFIED: Updated confirmation message
    if (
      window.confirm(
        `Are you sure you want to translate SEO text for "${entityName}" into all languages? This will OVERWRITE any existing translations.`
      )
    ) {
      translateAllMutation.mutate({
        pageType,
        entityId: primaryContent.entityId,
      });
    }
  };

  const isBusy =
    regeneratePrimaryMutation.isPending ||
    translateAllMutation.isPending ||
    deleteMutation.isPending;

  return (
    <tr className="border-t-2 border-gray-800 bg-brand-secondary hover:bg-gray-800/50 transition-colors">
      <td className="p-4 align-top">
        <p className="font-bold text-white text-base">{entityName}</p>
      </td>
      <td className="p-4 align-top">
        <Popover className="relative">
          <Popover.Button className="flex items-center gap-2 rounded-md bg-gray-700/80 px-3 py-1.5 text-xs font-semibold text-brand-light hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-purple">
            <Languages size={14} />
            <span>
              {translatedCount} / {totalLanguages} Languages
            </span>
          </Popover.Button>
          <Transition
            as={Fragment}
            enter="transition ease-out duration-200"
            enterFrom="opacity-0 translate-y-1"
            enterTo="opacity-100 translate-y-0"
            leave="transition ease-in duration-150"
            leaveFrom="opacity-100 translate-y-0"
            leaveTo="opacity-0 translate-y-1"
          >
            <Popover.Panel
              style={{ backgroundColor: "#1f1d2b" }}
              className="absolute z-30 mt-2 w-80 origin-top-left rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none border border-gray-700"
            >
              <div className="p-2">
                <div className="p-2 font-bold text-white">
                  Translations Status
                </div>
                <div className="max-h-60 overflow-y-auto custom-scrollbar space-y-1">
                  {allActiveLanguages.map((lang) => {
                    const translation = existingTranslationsMap.get(lang.code);
                    const isPrimaryLanguage = lang.code === DEFAULT_LOCALE;
                    return (
                      <div
                        key={lang.code}
                        className="relative"
                        onMouseEnter={() => setHoveredLang(lang.code)}
                        onMouseLeave={() => setHoveredLang(null)}
                      >
                        <div className="flex items-center justify-between p-2 rounded-md hover:bg-brand-secondary">
                          <div className="flex items-start gap-2 min-w-0">
                            {lang.flagUrl && (
                              <Image
                                src={lang.flagUrl}
                                alt={lang.name}
                                width={20}
                                height={15}
                                className="rounded-sm mt-0.5 flex-shrink-0"
                              />
                            )}
                            <div className="min-w-0">
                              <span className="text-sm font-medium text-brand-light block">
                                {lang.name}
                              </span>
                              {translation ? (
                                <p className="text-xs text-gray-400 truncate">
                                  {createExcerpt(translation.seoText)}
                                </p>
                              ) : (
                                <span className="text-xs text-brand-muted">
                                  Missing
                                </span>
                              )}
                            </div>
                          </div>
                          {/* MODIFIED: Regenerate/Re-translate button with clear labeling */}
                          {translation && (
                            <button
                              onClick={() => handleRegenerateSingle(lang.code)}
                              disabled={regeneratingLang === lang.code}
                              className="p-1 text-blue-400 hover:text-blue-300 disabled:text-gray-500 disabled:cursor-wait flex-shrink-0"
                              title={
                                isPrimaryLanguage
                                  ? `Regenerate for ${lang.name}`
                                  : `Re-translate for ${lang.name}`
                              }
                            >
                              {regeneratingLang === lang.code ? (
                                <Loader2 size={14} className="animate-spin" />
                              ) : (
                                <RefreshCw size={14} />
                              )}
                            </button>
                          )}
                        </div>
                        {translation && hoveredLang === lang.code && (
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-md bg-black border border-gray-700 p-3 rounded-lg shadow-2xl z-20">
                            <div
                              className="prose prose-sm prose-invert max-w-none text-text-secondary leading-relaxed"
                              dangerouslySetInnerHTML={{
                                __html: translation.seoText,
                              }}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </Popover.Panel>
          </Transition>
        </Popover>
      </td>
      <td className="p-4 align-middle text-center">
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={handleRegeneratePrimary}
            disabled={isBusy}
            className="p-2 text-brand-muted hover:text-white transition-colors disabled:opacity-50"
            title={`Regenerate for Primary Language (${DEFAULT_LOCALE.toUpperCase()})`}
          >
            {regeneratePrimaryMutation.isPending ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <RefreshCw size={18} />
            )}
          </button>
          {/* MODIFIED: Button is no longer disabled when all translations are complete */}
          <button
            onClick={handleTranslateAll}
            disabled={isBusy}
            className="p-2 text-brand-muted hover:text-white transition-colors disabled:opacity-50"
            title="Translate all missing or existing languages"
          >
            {translateAllMutation.isPending ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Languages size={18} />
            )}
          </button>
          <button
            onClick={handleDelete}
            disabled={isBusy}
            className="p-2 text-red-500/70 hover:text-red-500 transition-colors disabled:opacity-50"
            title="Delete all content for this entity"
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
