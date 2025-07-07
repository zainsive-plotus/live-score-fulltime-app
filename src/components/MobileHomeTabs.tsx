// src/components/MobileHomeTabs.tsx
"use client";

import { Home, List, Calendar, Sparkles } from "lucide-react";
import Link from "next/link";
import clsx from "clsx";
import { useTranslation } from "@/hooks/useTranslation";

interface MobileHomeTabsProps {
  selectedTab: string;
  onSelectTab: (tab: string) => void;
  activeLeaguesCount: number;
  liveMatchesCount: number;
}

const MobileHomeTabs: React.FC<MobileHomeTabsProps> = ({
  selectedTab,
  onSelectTab,
  activeLeaguesCount,
  liveMatchesCount,
}) => {
  const { t } = useTranslation();

  const showActiveBadge = activeLeaguesCount > 0;
  const showLiveBadge = liveMatchesCount > 0;

  return (
    // This div makes the navigation bar fixed at the bottom of the viewport.
    // It's visible only on screens smaller than 'lg' breakpoint (Tailwind's default for 1024px).
    // z-[90] ensures it sits above most content but leaves room for modals/toasts (often z-100+).
    <div className="fixed bottom-0 left-0 w-full bg-brand-secondary border-t border-gray-700 z-[90] lg:hidden">
      <div className="flex justify-around items-center h-16 max-w-xl mx-auto">
        <Link
          href="/"
          className={clsx(
            "flex flex-col items-center justify-center flex-1 py-1 rounded-md transition-colors",
            selectedTab === "home"
              ? "text-brand-purple"
              : "text-brand-light hover:text-white"
          )}
          onClick={() => onSelectTab("home")}
          aria-label={t("home")}
        >
          <Home size={20} />
          <span className="text-xs font-medium mt-1">{t("home")}</span>
        </Link>
        <Link
          href="/football/fixtures"
          className={clsx(
            "flex flex-col items-center justify-center flex-1 py-1 rounded-md transition-colors relative",
            selectedTab === "fixtures"
              ? "text-brand-purple"
              : "text-brand-light hover:text-white"
          )}
          onClick={() => onSelectTab("fixtures")}
          aria-label={t("fixtures")}
        >
          <Calendar size={20} />
          {showActiveBadge && (
            <span className="absolute top-0 right-3 bg-red-500 text-white text-[10px] px-1 py-0.5 rounded-full leading-none">
              {activeLeaguesCount}
            </span>
          )}
          <span className="text-xs font-medium mt-1">{t("fixtures")}</span>
        </Link>
        <Link
          href="/football/live"
          className={clsx(
            "flex flex-col items-center justify-center flex-1 py-1 rounded-md transition-colors relative",
            selectedTab === "live"
              ? "text-brand-purple"
              : "text-brand-light hover:text-white"
          )}
          onClick={() => onSelectTab("live")}
          aria-label={t("live_matches")}
        >
          <Sparkles size={20} />
          {showLiveBadge && (
            <span className="absolute top-0 right-3 bg-red-500 text-white text-[10px] px-1 py-0.5 rounded-full leading-none animate-pulse">
              {liveMatchesCount}
            </span>
          )}
          <span className="text-xs font-medium mt-1">{t("live")}</span>
        </Link>
        <Link
          href="/football/news"
          className={clsx(
            "flex flex-col items-center justify-center flex-1 py-1 rounded-md transition-colors",
            selectedTab === "news"
              ? "text-brand-purple"
              : "text-brand-light hover:text-white"
          )}
          onClick={() => onSelectTab("news")}
          aria-label={t("news")}
        >
          <List size={20} />
          <span className="text-xs font-medium mt-1">{t("news")}</span>
        </Link>
      </div>
    </div>
  );
};

export default MobileHomeTabs;
