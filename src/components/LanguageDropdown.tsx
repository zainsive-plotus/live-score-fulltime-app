// ===== src/components/LanguageDropdown.tsx =====

"use client";

import { useState, Fragment, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { ChevronDown, Loader2 } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { ILanguage } from "@/models/Language";
import { Menu, Transition } from "@headlessui/react";
import { DEFAULT_LOCALE } from "@/lib/i18n/config";

interface LanguageDropdownProps {
  languages: ILanguage[] | undefined;
  isLoading: boolean;
}

export default function LanguageDropdown({
  languages,
  isLoading,
}: LanguageDropdownProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const pathname = usePathname();
  let { locale: currentLocale } = useTranslation();

  currentLocale = currentLocale ?? "tr";

  const selectedLanguage = languages?.find(
    (lang) => lang.code === currentLocale
  );

  const handleSelect = (newLocale: string) => {
    startTransition(() => {
      let newPath: string | undefined;

      // --- Primary Strategy: Read hreflang tags from the document head ---
      // This is the most reliable way to find the correct URL for translated content.
      const linkElements = document.querySelectorAll<HTMLLinkElement>(
        'link[rel="alternate"][hreflang]'
      );

      if (linkElements.length > 0) {
        const hreflangMap = new Map<string, string>();
        linkElements.forEach((link) => {
          const lang = link.getAttribute("hreflang");
          const href = link.getAttribute("href");
          if (lang && href) {
            hreflangMap.set(lang, href);
          }
        });

        if (hreflangMap.has(newLocale)) {
          newPath = hreflangMap.get(newLocale);
        }
      }

      // --- Fallback Strategy: Manually construct the URL ---
      // This works for pages where the slug doesn't change between languages (e.g., /faq, /contact-us).
      if (!newPath) {
        const isSwitchingToDefault = newLocale === DEFAULT_LOCALE;
        const isSwitchingFromDefault = currentLocale === DEFAULT_LOCALE;

        if (isSwitchingToDefault) {
          // from /en/some-page -> /some-page
          newPath = pathname.startsWith(`/${currentLocale}`)
            ? pathname.replace(`/${currentLocale}`, "")
            : pathname;
        } else if (isSwitchingFromDefault) {
          // from /some-page -> /en/some-page
          newPath = `/${newLocale}${pathname}`;
        } else {
          // from /fr/some-page -> /es/some-page
          newPath = pathname.replace(`/${currentLocale}`, `/${newLocale}`);
        }

        // Ensure the root path is correct
        if (newPath === "") newPath = "/";
      }

      if (newPath) {
        router.push(newPath);
      }
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
    <Menu as="div" className="relative inline-block text-left w-full md:w-auto">
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
