// ===== src/app/not-found.tsx (No Changes Needed) =====
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
// No new package needed, we will use a simple cookie parser.
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from "@/lib/i18n/config";
import Loading from "@/app/[locale]/loading";

// Helper function to read a cookie on the client-side
const getCookie = (name: string): string | undefined => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift();
};

export default function RootNotFound() {
  const router = useRouter();

  useEffect(() => {
    const cookieLocale = getCookie("NEXT_LOCALE");
    let targetLocale = DEFAULT_LOCALE;

    if (cookieLocale && SUPPORTED_LOCALES.includes(cookieLocale)) {
      targetLocale = cookieLocale;
    } else {
      const browserLang = navigator.language.split("-")[0];
      if (SUPPORTED_LOCALES.includes(browserLang)) {
        targetLocale = browserLang;
      }
    }

    router.replace(`/${targetLocale}/404`);
  }, [router]);

  return <Loading />;
}
