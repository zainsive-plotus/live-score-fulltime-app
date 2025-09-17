// ===== src/components/player/PlayerDetailView.tsx =====
"use client";

import { useState, useMemo, Suspense, useEffect } from "react";
import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import { useTranslation } from "@/hooks/useTranslation";
import { BarChart3, Repeat, Trophy } from "lucide-react";
import PlayerHeader from "./PlayerHeader";

// Dynamic imports for tab components
const PlayerStatsWidget = dynamic(() => import("./PlayerStatsWidget"));
const PlayerTransfersWidget = dynamic(() => import("./PlayerTransfersWidget"));
const PlayerTrophiesWidget = dynamic(() => import("./PlayerTrophiesWidget"));

// --- DYNAMICALLY IMPORT THE GENERAL HIGHLIGHTS WIDGET ---
const HighlightsSkeleton = () => (
  <div className="aspect-video w-full bg-brand-secondary rounded-lg animate-pulse"></div>
);
const LatestHighlightsWidget = dynamic(
  () => import("@/components/LatestHighlightsWidget"),
  {
    loading: () => <HighlightsSkeleton />,
    ssr: false,
  }
);

const TabButton = ({ name, icon: Icon, isActive, onClick }: any) => (
  <button
    onClick={onClick}
    className={`flex-shrink-0 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-semibold transition-colors ${
      isActive
        ? "bg-[var(--brand-accent)] text-white shadow-md"
        : "text-brand-muted hover:bg-white/5 hover:text-white"
    }`}
  >
    <Icon size={16} />
    {name}
  </button>
);

const DEFAULT_TAB = "stats";

export default function PlayerDetailView({ playerData }: { playerData: any }) {
  const { t } = useTranslation();
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState(DEFAULT_TAB);
  const { stats, transfers, trophies } = playerData;

  const TABS = useMemo(
    () => [
      { name: t("stats"), key: "stats", icon: BarChart3 },
      ...(transfers && transfers.length > 0
        ? [{ name: t("transfers"), key: "transfers", icon: Repeat }]
        : []),
      ...(trophies && trophies.length > 0
        ? [{ name: t("honours"), key: "honours", icon: Trophy }]
        : []),
    ],
    [t, transfers, trophies]
  );

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace("#", "").toLowerCase();
      const isValidTab = TABS.some((tab) => tab.key === hash);
      setActiveTab(isValidTab ? hash : DEFAULT_TAB);
    };
    handleHashChange();
    window.addEventListener("hashchange", handleHashChange);
    return () => {
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, [pathname, TABS]);

  const handleTabClick = (tabKey: string) => {
    window.location.hash = tabKey;
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "transfers":
        return <PlayerTransfersWidget transfers={transfers} />;
      case "honours":
        return <PlayerTrophiesWidget trophies={trophies} />;
      case "stats":
      default:
        return <PlayerStatsWidget stats={stats.statistics} />;
    }
  };

  return (
    <div className="space-y-6">
      <PlayerHeader player={stats.player} statistics={stats.statistics[0]} />
      <div className="bg-brand-secondary rounded-lg p-2 flex items-center space-x-2 top-[88px] z-30 overflow-x-auto scrollbar-hide">
        {TABS.map((tab) => (
          <TabButton
            key={tab.key}
            name={tab.name}
            icon={tab.icon}
            isActive={activeTab === tab.key}
            onClick={() => handleTabClick(tab.key)}
          />
        ))}
      </div>

      <div className="min-h-[400px]">
        <Suspense
          fallback={
            <div className="w-full h-96 bg-brand-secondary rounded-lg animate-pulse"></div>
          }
        >
          {renderTabContent()}
        </Suspense>
      </div>

      {/* --- ADDED RECENT HIGHLIGHTS WIDGET UNDER THE TABS --- */}
      <div className="pt-4">
        <Suspense fallback={<HighlightsSkeleton />}>
          <LatestHighlightsWidget />
        </Suspense>
      </div>
    </div>
  );
}
