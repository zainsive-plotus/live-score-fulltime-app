// ===== src/components/admin/TranslationStatusPopover.tsx =====

"use client";

import { Popover, Transition } from "@headlessui/react";
import { Fragment } from "react";
import Image from "next/image";
import { ILanguage } from "@/models/Language";
import { ITickerMessage } from "@/models/TickerMessage";
import { Languages, Edit, Plus, CheckCircle, XCircle } from "lucide-react";

interface TranslationStatusPopoverProps {
  group: ITickerMessage[];
  allActiveLanguages: ILanguage[];
  onEdit: (message: ITickerMessage) => void;
}

export default function TranslationStatusPopover({
  group,
  allActiveLanguages,
  onEdit,
}: TranslationStatusPopoverProps) {
  const existingTranslationsMap = new Map(group.map((p) => [p.language, p]));
  const translatedCount = existingTranslationsMap.size;
  const totalCount = allActiveLanguages.length;

  return (
    <Popover className="relative">
      <Popover.Button className="flex items-center gap-2 rounded-md bg-gray-700/80 px-3 py-1.5 text-xs font-semibold text-brand-light hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-purple">
        <Languages size={14} />
        <span>
          {translatedCount} / {totalCount} Languages
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
        <Popover.Panel className="absolute right-0 z-10 mt-2 w-72 origin-top-right rounded-md bg-brand-dark shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none border border-gray-700">
          <div className="p-2">
            <div className="p-2 font-bold text-white">Translations Status</div>
            <div className="max-h-60 overflow-y-auto custom-scrollbar space-y-1">
              {allActiveLanguages.map((lang) => {
                const translation = existingTranslationsMap.get(lang.code);
                const isAvailable = !!translation;
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
                    {isAvailable ? (
                       <button
                        onClick={() => onEdit(translation)}
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
    </Popover>
  );
}