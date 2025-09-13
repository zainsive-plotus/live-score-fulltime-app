// ===== src/components/match/MatchDetailView.tsx =====

"use client";

import { useState, Suspense } from "react";
import dynamic from "next/dynamic";
import { useTranslation } from "@/hooks/useTranslation";
import { Info, List, BarChart3, Swords, ListOrdered } from "lucide-react";

import { MatchHeader } from "@/components/match/MatchHeader";
import MatchSeoWidget from "./MatchSeoWidget";

// Skeletons for suspense fallbacks provide a better loading experience
const TeamFormContentSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    <div className="bg-brand-secondary rounded-lg h-[400px] animate-pulse p-4"></div>
    <div className="bg-brand-secondary rounded-lg h-[400px] animate-pulse p-4"></div>
  </div>
);
const FormationSkeleton = () => (
  <div className="bg-brand-secondary rounded-lg p-4 md:p-6 animate-pulse h-[600px]"></div>
);
const H2HContentSkeleton = () => (
  <div className="bg-brand-secondary rounded-lg h-[450px] animate-pulse p-6"></div>
);

// Dynamically import child components for better performance
const TeamFormWidget = dynamic(
  () => import("@/components/match/TeamFormWidget")
);
const MatchFormationWidget = dynamic(
  () => import("@/components/match/MatchFormationWidget")
);
const MatchH2HWidget = dynamic(
  () => import("@/components/match/MatchH2HWidget")
);
const MatchStatsWidget = dynamic(
  () => import("@/components/match/MatchStatsWidget")
);
const MatchActivityWidget = dynamic(
  () => import("@/components/match/MatchActivityWidget")
);
const StandingsWidget = dynamic(() => import("@/components/StandingsWidget"));

// The "Info" tab component, which groups Form and Formation widgets
const MatchInfoTab = ({ matchData }: { matchData: any }) => {
  const { fixtureData, fixtureId, homeTeamStats, awayTeamStats } = matchData;
  const { teams } = fixtureData;
  return (
    <div className="space-y-6">
      <Suspense fallback={<TeamFormContentSkeleton />}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <TeamFormWidget
            team={teams.home}
            location="Home"
            teamStats={homeTeamStats}
          />
          <TeamFormWidget
            team={teams.away}
            location="Away"
            teamStats={awayTeamStats}
          />
        </div>
      </Suspense>
      <Suspense fallback={<FormationSkeleton />}>
        <MatchFormationWidget fixtureId={fixtureId} />
      </Suspense>
    </div>
  );
};

// Main View Component
export default function MatchDetailView({ matchData }: { matchData: any }) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("Info");

  const {
    fixtureData,
    statistics,
    h2h,
    fixtureId,
    isLive,
    isFinished,
    seoWidgetData,
    standingsResponse,
  } = matchData;
  const { teams, league } = fixtureData;

  const hasStandings =
    league.type === "League" && standingsResponse?.[0]?.league?.standings?.[0];

  const TABS = [
    { name: "Info", icon: Info },
    { name: "Timeline", icon: List },
    ...(isLive || isFinished ? [{ name: "Stats", icon: BarChart3 }] : []),
    { name: "H2H", icon: Swords },
    ...(hasStandings ? [{ name: "Standings", icon: ListOrdered }] : []),
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case "Timeline":
        return (
          <MatchActivityWidget
            fixtureId={fixtureId}
            isLive={isLive}
            homeTeamId={teams.home.id}
          />
        );
      case "Stats":
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
      case "Info":
      default:
        return <MatchInfoTab matchData={matchData} />;
    }
  };

  return (
    <div className="space-y-6">
      <MatchHeader fixture={fixtureData} />

      <div className="bg-brand-secondary rounded-lg p-2 flex items-center space-x-2 sticky top-[88px] z-30 overflow-x-auto scrollbar-hide">
        {TABS.map((tab) => (
          <button
            key={tab.name}
            onClick={() => setActiveTab(tab.name)}
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
