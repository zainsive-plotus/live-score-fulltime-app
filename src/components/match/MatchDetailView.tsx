// ===== src/components/match/MatchDetailView.tsx (CORRECTED & FINAL) =====
"use client";

import { useState, Suspense, useMemo, useEffect } from "react";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useTranslation } from "@/hooks/useTranslation";
import { Info, List, BarChart3, Swords, ListOrdered } from "lucide-react";

import { useLiveFixtureUpdates } from "@/hooks/useLiveFixtureUpdates"; // Import the hook
import { MatchHeader } from "@/components/match/MatchHeader";
import MatchSeoWidget from "./MatchSeoWidget";

// --- Dynamic Imports for Tab Content ---
const MatchActivityWidget = dynamic(
  () => import("@/components/match/MatchActivityWidget")
);
const MatchStatsWidget = dynamic(
  () => import("@/components/match/MatchStatsWidget")
);
const MatchH2HWidget = dynamic(
  () => import("@/components/match/MatchH2HWidget")
);
const StandingsWidget = dynamic(() => import("@/components/StandingsWidget"));

const H2HContentSkeleton = () => (
  <div className="bg-brand-secondary rounded-lg h-[450px] animate-pulse p-6"></div>
);
const DEFAULT_TAB = "Timeline";

export default function MatchDetailView({
  matchData: initialMatchData,
}: {
  matchData: any;
}) {
  const { t } = useTranslation();
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState(DEFAULT_TAB);

  // Use the hook to get initial data and subscribe to live updates via WebSocket
  const liveMatchData = useLiveFixtureUpdates(initialMatchData);

  // Destructure from the live data source for re-rendering
  const {
    fixtureData,
    statistics,
    h2h,
    fixtureId,
    isLive,
    isFinished,
    seoWidgetData,
    standingsResponse,
  } = liveMatchData;

  const { teams, league } = fixtureData;

  const hasStandings =
    league.type === "League" && standingsResponse?.[0]?.league?.standings?.[0];

  const TABS = useMemo(
    () => [
      { name: "Timeline", icon: List },
      ...(isLive || isFinished ? [{ name: "Stats", icon: BarChart3 }] : []),
      { name: "H2H", icon: Swords },
      ...(hasStandings ? [{ name: "Standings", icon: ListOrdered }] : []),
    ],
    [isLive, isFinished, hasStandings]
  );

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace("#", "");
      const tabFromHash = hash.charAt(0).toUpperCase() + hash.slice(1);
      const isValidTab = TABS.some(
        (tab) => tab.name.toLowerCase() === hash.toLowerCase()
      );
      setActiveTab(isValidTab ? tabFromHash : DEFAULT_TAB);
    };

    handleHashChange();
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, [pathname, TABS]);

  const handleTabClick = (tabName: string) => {
    window.location.hash = tabName.toLowerCase();
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "Timeline":
        return (
          <MatchActivityWidget
            fixtureId={fixtureId}
            isLive={isLive}
            homeTeamId={teams.home.id}
            // Pass the live events down as a prop
            liveEvents={fixtureData.events}
          />
        );
      case "Stats":
        // Pass the live statistics down as a prop
        return <MatchStatsWidget statistics={statistics || []} teams={teams} />;
      case "H2H":
        return (
          <Suspense fallback={<H2HContentSkeleton />}>
            <MatchH2HWidget
              teams={teams}
              currentFixtureId={fixtureId}
              h2hSeoDescription={seoWidgetData.h2hSeoDescription || ""}
            />
          </Suspense>
        );
      case "Standings":
        return hasStandings ? (
          <StandingsWidget
            leagueId={league.id}
            season={league.season}
            homeTeamId={teams.home.id}
            awayTeamId={teams.away.id}
          />
        ) : null;
      default:
        return (
          <MatchActivityWidget
            fixtureId={fixtureId}
            isLive={isLive}
            homeTeamId={teams.home.id}
            liveEvents={fixtureData.events}
          />
        );
    }
  };

  return (
    <div className="space-y-6">
      <MatchHeader fixture={fixtureData} />

      <div className="bg-brand-secondary rounded-lg p-2 flex items-center space-x-2 top-[88px] z-30 overflow-x-auto scrollbar-hide">
        {TABS.map((tab) => (
          <button
            key={tab.name}
            onClick={() => handleTabClick(tab.name)}
            className={`flex-shrink-0 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-semibold transition-colors ${
              activeTab === tab.name
                ? "bg-[var(--brand-accent)] text-white shadow-md"
                : "text-brand-muted hover:bg-white/5 hover:text-white"
            }`}
          >
            <tab.icon size={16} />
            {t(tab.name.toLowerCase())}
          </button>
        ))}
      </div>

      <div className="min-h-[600px]">{renderTabContent()}</div>

      <MatchSeoWidget
        title={seoWidgetData.title}
        seoText={seoWidgetData.seoText}
      />
    </div>
  );
}
