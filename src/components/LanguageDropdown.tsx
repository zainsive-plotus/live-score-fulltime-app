"use client";

import { useState, useTransition } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ChevronDown, Loader2 } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { setLocaleCookie } from "@/app/actions/language";
import { ILanguage } from "@/models/Language";

const fetchActiveLanguages = async (): Promise<ILanguage[]> => {
  const { data } = await axios.get("/api/admin/languages");
  return data.filter((lang: ILanguage) => lang.isActive);
};

export default function LanguageDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { locale } = useTranslation();

  const { data: languages, isLoading } = useQuery<ILanguage[]>({
    queryKey: ["activeLanguages"],
    queryFn: fetchActiveLanguages,
    staleTime: 1000 * 60 * 60, // 1 hour
  });

  const selectedLanguage = languages?.find((lang) => lang.code === locale);

  const handleSelect = (code: string) => {
    startTransition(() => {
      setLocaleCookie(code).then(() => {
        router.refresh();
        setIsOpen(false);
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
            />
          ) : (
            <span>{selectedLanguage.code.toUpperCase()}</span>
          )}
          <span className="text-sm hidden md:block">
            {selectedLanguage.name}
          </span>
        </>
      );
    }
    return <span>Select Language</span>;
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading || isPending}
        className="flex items-center gap-2 bg-brand-secondary px-3 py-2 rounded-lg text-brand-light font-medium hover:bg-gray-700/50 transition-colors disabled:opacity-50"
      >
        {buttonContent()}
        <ChevronDown
          size={16}
          className={`transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 w-40 bg-brand-secondary rounded-lg shadow-lg z-50 border border-gray-700/50">
          <ul className="text-brand-light">
            {languages?.map((lang) => (
              <li key={lang.code}>
                <button
                  onClick={() => handleSelect(lang.code)}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-sm hover:bg-brand-purple transition-colors"
                >
                  {lang.flagUrl ? (
                    <Image
                      src={lang.flagUrl}
                      alt={lang.name}
                      width={20}
                      height={15}
                    />
                  ) : (
                    <span className="w-5 text-center">
                      {lang.code.toUpperCase()}
                    </span>
                  )}
                  <span>{lang.name}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
