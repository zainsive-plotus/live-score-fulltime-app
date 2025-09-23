// ===== src/components/NotFoundClientContent.tsx (NEW FILE) =====
"use client";

import { useMemo, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Frown, Search } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

// Helper to extract keywords from the broken URL path
const extractKeywordsFromPath = (path: string): string => {
  return path
    .split("/")
    .filter(
      (segment) =>
        ![
          "en",
          "fr",
          "es",
          "it",
          "zu",
          "tr",
          "football",
          "team",
          "league",
          "match",
          "404",
        ].includes(segment)
    )
    .join(" ")
    .replace(/-/g, " ");
};

export default function NotFoundClientContent() {
  const pathname = usePathname();
  const { t } = useTranslation();

  // Pre-fill the search input with relevant terms from the URL
  const suggestedSearchQuery = useMemo(
    () => extractKeywordsFromPath(pathname),
    [pathname]
  );

  // Client-side logging of the 404 event
  useEffect(() => {
    const log404 = async () => {
      try {
        await fetch("/api/log/404", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            path: pathname,
            referrer: document.referrer,
          }),
        });
      } catch (error) {
        /* Silently fail */
      }
    };
    log404();
  }, [pathname]);

  return (
    <main className="flex-1 flex flex-col items-center justify-center text-center p-4">
      <Frown className="w-16 h-16 text-text-muted mb-4" />
      <h1 className="text-4xl md:text-5xl font-extrabold text-white">
        {t("404_title")}
      </h1>
      <p className="text-lg text-text-secondary mt-2 mb-8 max-w-lg">
        {t("404_description")}
      </p>

      <div className="w-full max-w-md mb-8">
        <form action="/search" method="GET" className="relative">
          <input
            type="search"
            name="q"
            defaultValue={suggestedSearchQuery}
            placeholder={t("404_search_placeholder")}
            className="w-full bg-brand-secondary border border-gray-700/50 rounded-lg p-4 pl-12 text-white placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-[var(--brand-accent)]"
          />
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted"
            size={20}
          />
        </form>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-4">
        <Link
          href="/"
          className="px-5 py-2 bg-brand-purple text-white font-bold rounded-lg hover:opacity-90"
        >
          {t("homepage")}
        </Link>
        <Link
          href="/football/leagues"
          className="px-5 py-2 bg-brand-secondary text-white font-bold rounded-lg hover:bg-gray-700"
        >
          {t("leagues")}
        </Link>
        <Link
          href="/news"
          className="px-5 py-2 bg-brand-secondary text-white font-bold rounded-lg hover:bg-gray-700"
        >
          {t("news")}
        </Link>
      </div>
    </main>
  );
}
