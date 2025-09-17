// ===== src/components/player/PlayerDetailView.tsx =====
"use client";

import { useState, useMemo, Suspense, useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { useTranslation } from "@/hooks/useTranslation";
import { BarChart3, Repeat, Trophy, UserCircle } from "lucide-react";
import PlayerHeader from "./PlayerHeader";

// ... (Dynamic imports and other components remain the same) ...
const PlayerStatsWidget = dynamic(() => import("./PlayerStatsWidget"));
const PlayerTransfersWidget = dynamic(() => import("./PlayerTransfersWidget"));
const PlayerTrophiesWidget = dynamic(() => import("./PlayerTrophiesWidget"));
const PlayerProfileWidget = dynamic(() => import("./PlayerProfileWidget"));
const LatestHighlightsWidget = dynamic(
  () => import("@/components/LatestHighlightsWidget")
);

const HighlightsSkeleton = () => (
  <div className="aspect-video w-full bg-brand-secondary rounded-lg animate-pulse"></div>
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

const DEFAULT_TAB = "profile"; // Let's default to the profile tab

export default function PlayerDetailView({
  playerData,
  availableSeasons,
  selectedSeason,
}: {
  playerData: any;
  availableSeasons: number[];
  selectedSeason: number;
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState(DEFAULT_TAB);
  const { stats, transfers, trophies } = playerData;

  const TABS = useMemo(
    () => [
      { name: t("profile"), key: "profile", icon: UserCircle },
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
    const handleStateUpdate = () => {
      const hash = window.location.hash.replace("#", "").toLowerCase();
      const initialTab = hash
        ? TABS.some((tab) => tab.key === hash)
          ? hash
          : DEFAULT_TAB
        : DEFAULT_TAB;
      setActiveTab(initialTab);
    };
    handleStateUpdate();
    window.addEventListener("hashchange", handleStateUpdate);
    return () => window.removeEventListener("hashchange", handleStateUpdate);
  }, [pathname, searchParams, TABS]); // Listen to searchParams changes as well

  const handleSeasonChange = (newSeason: number) => {
    const currentParams = new URLSearchParams(
      Array.from(searchParams.entries())
    );
    currentParams.set("season", newSeason.toString());
    const newUrl = `${pathname}?${currentParams.toString()}`;
    router.push(newUrl + window.location.hash, { scroll: false });
  };

  // --- MODIFIED handleTabClick ---
  const handleTabClick = (tabKey: string) => {
    const currentParams = new URLSearchParams(
      Array.from(searchParams.entries())
    );

    // If we are navigating to any tab that is NOT the stats tab, remove the league param.
    if (tabKey !== "stats") {
      currentParams.delete("league");
    }

    const queryString = currentParams.toString();
    const newUrl = queryString ? `${pathname}?${queryString}` : pathname;

    // Use router.push to update the URL, then manually set the hash.
    // This is more reliable across different Next.js versions.
    router.push(newUrl + `#${tabKey}`, { scroll: false });
  };
  // --- END of MODIFICATION ---

  const renderTabContent = () => {
    // ... (renderTabContent logic remains the same)
    switch (activeTab) {
      case "profile":
        return <PlayerProfileWidget player={stats.player} />;
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
      <PlayerHeader
        player={stats.player}
        statistics={stats.statistics[0]}
        availableSeasons={availableSeasons}
        selectedSeason={selectedSeason}
        onSeasonChange={handleSeasonChange}
      />
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
      <div className="pt-4">
        <Suspense fallback={<HighlightsSkeleton />}>
          <LatestHighlightsWidget />
        </Suspense>
      </div>
    </div>
  );
}
