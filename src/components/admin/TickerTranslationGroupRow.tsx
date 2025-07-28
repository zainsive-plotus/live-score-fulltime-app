// ===== src/components/admin/TickerTranslationGroupRow.tsx =====

"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import toast from "react-hot-toast";
import { ITickerMessage } from "@/models/TickerMessage";
import { ILanguage } from "@/models/Language";
import { Trash2, Languages, Loader2, Edit, XCircle } from "lucide-react";
import { Popover, Transition, Portal } from "@headlessui/react";
import { Fragment } from "react";
import Image from "next/image";

interface TickerTranslationGroupRowProps {
  group: ITickerMessage[];
  allActiveLanguages: ILanguage[];
  onDelete: (messageId: string) => void;
  onEdit: (message: ITickerMessage) => void;
}

export default function TickerTranslationGroupRow({
  group,
  allActiveLanguages,
  onDelete,
  onEdit,
}: TickerTranslationGroupRowProps) {
  const queryClient = useQueryClient();
  const masterMessage = group[0];

  const existingTranslationsMap = new Map(group.map((p) => [p.language, p]));
  const translatedCount = existingTranslationsMap.size;
  const totalCount = allActiveLanguages.length;

  const translateMutation = useMutation({
    mutationFn: (sourceMessageId: string) =>
      axios.post("/api/admin/ticker-messages/translate", { sourceMessageId }),
    onSuccess: (data) => {
      toast.success(data.data.message || "Translations generated!");
      queryClient.invalidateQueries({ queryKey: ["tickerMessagesAdmin"] });
    },
    onError: (err: any) => {
      toast.error(
        err.response?.data?.error || "Failed to generate translations."
      );
    },
  });

  const handleTranslateAll = () => {
    translateMutation.mutate(masterMessage._id);
  };

  const handleDeleteAll = () => {
    if (
      window.confirm(
        `Are you sure you want to delete this message and all of its translations? This action cannot be undone.`
      )
    ) {
      group.forEach((msg) => onDelete(msg._id));
    }
  };

  return (
    <tr className="border-t-2 border-gray-800 bg-brand-secondary hover:bg-gray-800/50 transition-colors">
      <td className="p-4 w-20 text-center font-bold align-top">
        {masterMessage.order}
      </td>
      <td className="p-4 align-top">
        <div className="flex items-start gap-3">
          <div>
            <p className="font-bold text-white text-base">{masterMessage.message}</p>
            <p className="text-xs text-brand-muted mt-1">
              Default ({masterMessage.language.toUpperCase()})
            </p>
          </div>
          <button onClick={() => onEdit(masterMessage)} className="text-brand-muted hover:text-white transition-colors flex-shrink-0">
            <Edit size={14} />
          </button>
        </div>
      </td>
      <td className="p-4 align-top">
        {/* --- Start of Final Fix --- */}
        {/* Adding `className="relative"` to the Popover root is the key. */}
        {/* This creates the positioning anchor for the Panel. */}
        <Popover className="relative">
          {({ open, close }) => (
            <>
              <Popover.Button className="flex items-center gap-2 rounded-md bg-gray-700/80 px-3 py-1.5 text-xs font-semibold text-brand-light hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-purple">
                <Languages size={14} />
                <span>
                  {translatedCount} / {totalCount} Languages
                </span>
              </Popover.Button>
              <Portal>
                <Transition
                  as={Fragment}
                  enter="transition ease-out duration-200"
                  enterFrom="opacity-0 translate-y-1"
                  enterTo="opacity-100 translate-y-0"
                  leave="transition ease-in duration-150"
                  leaveFrom="opacity-100 translate-y-0"
                  leaveTo="opacity-0 translate-y-1"
                >
                  {/* The Panel is now explicitly positioned relative to the button */}
                  <Popover.Panel className="absolute z-30 mt-2 w-72 origin-top-left rounded-md bg-brand-dark shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none border border-gray-700">
                    <div className="p-2">
                      <div className="p-2 font-bold text-white">Translations Status</div>
                      <div className="max-h-60 overflow-y-auto custom-scrollbar space-y-1">
                        {allActiveLanguages.map((lang) => {
                          const translation = existingTranslationsMap.get(lang.code);
                          const isAvailable = !!translation;
                          return (
                            <div key={lang.code} className="flex items-center justify-between p-2 rounded-md hover:bg-brand-secondary">
                              <div className="flex items-center gap-2">
                                {lang.flagUrl && (
                                  <Image src={lang.flagUrl} alt={lang.name} width={20} height={15} className="rounded-sm" />
                                )}
                                <span className="text-sm font-medium text-brand-light">{lang.name}</span>
                              </div>
                              {isAvailable ? (
                                <button
                                  onClick={() => { onEdit(translation); close(); }}
                                  className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300"
                                  title={`Edit ${lang.name} translation`}
                                >
                                  <Edit size={12} /> Edit
                                </button>
                              ) : (
                                <span className="flex items-center gap-1.5 text-xs text-brand-muted">
                                  <XCircle size={12} /> Missing
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </Popover.Panel>
                </Transition>
              </Portal>
            </>
          )}
        </Popover>
        {/* --- End of Final Fix --- */}
      </td>
      <td className="p-4 align-middle text-sm text-center">
        <span
          className={`px-2 py-1 text-xs font-semibold rounded-full whitespace-nowrap ${
            masterMessage.isActive
              ? "bg-green-500/20 text-green-400"
              : "bg-yellow-500/20 text-yellow-400"
          }`}
        >
          {masterMessage.isActive ? "Active" : "Inactive"}
        </span>
      </td>
      <td className="p-4 align-middle text-center space-y-2">
        <button
          onClick={handleTranslateAll}
          disabled={translateMutation.isPending || translatedCount === totalCount}
          className="w-full flex items-center justify-center gap-2 text-sm bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 font-semibold px-3 py-1.5 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {translateMutation.isPending ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Languages size={16} />
          )}
          <span>Translate All</span>
        </button>
        <button
          onClick={handleDeleteAll}
          className="text-gray-500 hover:text-red-400 transition-colors p-1"
          title="Delete entire translation group"
        >
          <Trash2 size={18} />
        </button>
      </td>
    </tr>
  );
}