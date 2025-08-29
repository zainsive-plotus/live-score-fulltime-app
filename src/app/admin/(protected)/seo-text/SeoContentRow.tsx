"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import toast from "react-hot-toast";
import { ISeoContent } from "@/models/SeoContent";
import { ILanguage } from "@/models/Language";
import {
  Languages,
  RefreshCw,
  Loader2,
  Edit,
  Plus,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Popover, Transition } from "@headlessui/react";
import { Fragment } from "react";

interface SeoContentRowProps {
  pageType: string;
  group: ISeoContent[];
  entityName: string;
  allActiveLanguages: ILanguage[];
}

export default function SeoContentRow({
  pageType,
  group,
  entityName,
  allActiveLanguages,
}: SeoContentRowProps) {
  const queryClient = useQueryClient();
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

  const regenerateMutation = useMutation({
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
      deleteMutation.mutate({
        pageType,
        entityId: primaryContent.entityId,
      });
    }
  };

  const handleRegenerate = () => {
    if (
      window.confirm(
        `Are you sure you want to regenerate the SEO text for "${entityName}" in the primary language? This will use the last saved master template.`
      )
    ) {
      regenerateMutation.mutate({
        pageType,
        entityId: primaryContent.entityId,
        language: primaryContent.language,
      });
    }
  };

  const handleTranslateAll = () => {
    if (
      window.confirm(
        `Are you sure you want to auto-translate SEO text for "${entityName}" into all missing languages?`
      )
    ) {
      translateAllMutation.mutate({
        pageType,
        entityId: primaryContent.entityId,
      });
    }
  };

  const isBusy =
    regenerateMutation.isPending ||
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
            <Popover.Panel className="absolute z-30 mt-2 w-72 origin-top-left rounded-md bg-brand-dark shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none border border-gray-700">
              <div className="p-2">
                <div className="p-2 font-bold text-white">
                  Translations Status
                </div>
                <div className="max-h-60 overflow-y-auto custom-scrollbar space-y-1">
                  {allActiveLanguages.map((lang) => {
                    const translation = existingTranslationsMap.get(lang.code);
                    return (
                      <div
                        key={lang.code}
                        className="flex items-center justify-between p-2 rounded-md hover:bg-brand-secondary"
                      >
                        <div className="flex items-center gap-2">
                          {lang.flagUrl && (
                            <Image
                              src={lang.flagUrl}
                              alt={lang.name}
                              width={20}
                              height={15}
                              className="rounded-sm"
                            />
                          )}
                          <span className="text-sm font-medium text-brand-light">
                            {lang.name}
                          </span>
                        </div>
                        <span
                          className={`text-xs font-semibold ${
                            translation ? "text-green-400" : "text-brand-muted"
                          }`}
                        >
                          {translation ? "Available" : "Missing"}
                        </span>
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
            onClick={handleRegenerate}
            disabled={isBusy}
            className="p-2 text-brand-muted hover:text-white transition-colors disabled:opacity-50"
            title="Regenerate for Primary Language"
          >
            {regenerateMutation.isPending ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <RefreshCw size={18} />
            )}
          </button>
          <button
            onClick={handleTranslateAll}
            disabled={isBusy || translatedCount === totalLanguages}
            className="p-2 text-brand-muted hover:text-white transition-colors disabled:opacity-50"
            title="Auto-translate all missing languages"
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
