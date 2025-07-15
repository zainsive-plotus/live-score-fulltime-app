"use client";

import { useState, useTransition, Fragment } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { ChevronDown, Loader2 } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { ILanguage } from "@/models/Language";
import { Menu, Transition } from "@headlessui/react";
import { setLocaleCookie } from "@/app/actions/language";

// This list must be kept in sync with middleware.ts
const DEFAULT_LOCALE = "tr";

const fetchActiveLanguages = async (): Promise<ILanguage[]> => {
  const { data } = await axios.get("/api/admin/languages");
  return data.filter((lang: ILanguage) => lang.isActive);
};

export default function LanguageDropdown() {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const pathname = usePathname();
  const { locale: currentLocale } = useTranslation();

  const { data: languages, isLoading } = useQuery<ILanguage[]>({
    queryKey: ["activeLanguages"],
    queryFn: fetchActiveLanguages,
    staleTime: 1000 * 60 * 60,
  });

  const selectedLanguage = languages?.find(
    (lang) => lang.code === currentLocale
  );

  const handleSelect = (newLocale: string) => {
    let newPath = "";
    const isSwitchingToDefault = newLocale === DEFAULT_LOCALE;
    const isSwitchingFromDefault = currentLocale === DEFAULT_LOCALE;

    if (isSwitchingToDefault) {
      // e.g., from /en/some-page to /some-page
      newPath = pathname.replace(`/${currentLocale}`, "");
    } else if (isSwitchingFromDefault) {
      // e.g., from /some-page to /en/some-page
      newPath = `/${newLocale}${pathname}`;
    } else {
      // e.g., from /en/some-page to /de/some-page
      newPath = pathname.replace(`/${currentLocale}`, `/${newLocale}`);
    }

    // Ensure the path is valid (handles homepage case)
    if (newPath === "") newPath = "/";

    startTransition(() => {
      // Set cookie for middleware to detect on next visit
      setLocaleCookie(newLocale).then(() => {
        router.push(newPath);
      });
    });
  };

  const buttonContent = () => {
    if (isLoading || isPending) {
      return <Loader2 size={20} className="animate-spin" />;
    }
    if (selectedLanguage) {
      return (
        <>
          {selectedLanguage.flagUrl ? (
            <Image
              src={selectedLanguage.flagUrl}
              alt={selectedLanguage.name}
              width={20}
              height={15}
              unoptimized
            />
          ) : (
            <span className="font-bold text-sm">
              {selectedLanguage.code.toUpperCase()}
            </span>
          )}
          <span className="text-sm hidden md:block">
            {selectedLanguage.name}
          </span>
          <ChevronDown
            size={16}
            className="transition-transform duration-200 ui-open:rotate-180"
          />
        </>
      );
    }
    return <span>Select Language</span>;
  };

  return (
    <Menu as="div" className="relative inline-block text-left">
      <div>
        <Menu.Button
          disabled={isLoading || isPending}
          className="inline-flex w-full justify-center items-center gap-2 bg-brand-secondary px-3 py-2 rounded-lg text-brand-light font-medium hover:bg-gray-700/50 transition-colors disabled:opacity-50"
        >
          {buttonContent()}
        </Menu.Button>
      </div>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 mt-2 w-48 origin-top-right divide-y divide-gray-700 rounded-md bg-brand-secondary shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-[100]">
          <div className="p-1">
            {languages?.map((lang) => (
              <Menu.Item key={lang.code}>
                {({ active }) => (
                  <button
                    onClick={() => handleSelect(lang.code)}
                    disabled={lang.code === currentLocale}
                    className={`${
                      active || lang.code === currentLocale
                        ? "bg-brand-purple text-white"
                        : "text-brand-light"
                    } group flex w-full items-center rounded-md px-2 py-2 text-sm disabled:opacity-70 disabled:cursor-not-allowed`}
                  >
                    <div className="flex items-center gap-3">
                      {lang.flagUrl ? (
                        <Image
                          src={lang.flagUrl}
                          alt={lang.name}
                          width={20}
                          height={15}
                          unoptimized
                        />
                      ) : (
                        <span className="w-5 text-center font-semibold">
                          {lang.code.toUpperCase()}
                        </span>
                      )}
                      <span>{lang.name}</span>
                    </div>
                  </button>
                )}
              </Menu.Item>
            ))}
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
}
