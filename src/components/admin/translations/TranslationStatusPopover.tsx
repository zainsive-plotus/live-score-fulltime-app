// ===== src/components/admin/translations/TranslationStatusPopover.tsx =====

"use client";

import { Popover, Transition } from "@headlessui/react";
import { Fragment } from "react";
import Image from "next/image";
import { ILanguage } from "@/models/Language";
import { ITranslation } from "@/models/Translation";
import { Languages, CheckCircle, XCircle } from "lucide-react";

interface TranslationStatusPopoverProps {
  translation: ITranslation;
  allActiveLanguages: ILanguage[];
}

export default function TranslationStatusPopover({
  translation,
  allActiveLanguages,
}: TranslationStatusPopoverProps) {
  const translatedCount = Object.keys(translation.translations).filter(
    (key) =>
      allActiveLanguages.some((lang) => lang.code === key) &&
      translation.translations[key as keyof typeof translation.translations]
  ).length;

  const totalCount = allActiveLanguages.length;
  const isComplete = translatedCount === totalCount;

  return (
    <Popover className="relative">
      <Popover.Button
        className={`flex items-center gap-2 rounded-md bg-gray-700/80 px-3 py-1.5 text-xs font-semibold hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-purple ${
          isComplete ? "text-green-400" : "text-brand-light"
        }`}
      >
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
        <Popover.Panel className="absolute left-1/2 z-10 mt-2 w-72 -translate-x-1/2 transform rounded-md bg-brand-dark shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none border border-gray-700">
          <div className="p-2">
            <div className="p-2 font-bold text-white">Translation Status</div>
            <div className="max-h-60 overflow-y-auto custom-scrollbar space-y-1">
              {allActiveLanguages.map((lang) => {
                const isAvailable =
                  !!translation.translations[
                    lang.code as keyof typeof translation.translations
                  ];
                return (
                  <div
                    key={lang.code}
                    className="flex items-center justify-between p-2 rounded-md"
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
                      <span className="flex items-center gap-1.5 text-xs text-green-400">
                        <CheckCircle size={14} /> Complete
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-xs text-brand-muted">
                        <XCircle size={14} /> Missing
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
