// ===== src/components/TeamDetailView.tsx =====

"use client";

import { useState, useMemo, Suspense } from "react";
import dynamic from "next/dynamic";
import { useTranslation } from "@/hooks/useTranslation";
import { generateLeagueSlug } from "@/lib/generate-league-slug";
import TeamHeader from "./team/TeamHeader";
import { CalendarClock, Users, ListOrdered, Repeat, Film } from "lucide-react";

// Dynamically import child components
const TeamSquadWidget = dynamic(() => import("./team/TeamSquadWidget"));
const TeamFixturesWidget = dynamic(() => import("./team/TeamFixturesWidget"));
const LeagueStandingsWidget = dynamic(
  () => import("@/components/league-detail-view/LeagueStandingsWidget")
);
const TeamTransfersTab = dynamic(() => import("./team/TeamTransfersTab"));
const TeamHighlightsTab = dynamic(() => import("./team/TeamHighlightsTab"));

// Main View Component
export default function TeamDetailView({ teamData }: { teamData: any }) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("Fixtures");

  const { teamInfo, squad, fixtures, standings, transfers, highlights } =
    teamData;
  const { team } = teamInfo;

  const primaryLeague = useMemo(() => {
    if (!standings || standings.length === 0) return null;
    const league = standings[0]?.league;
    return league
      ? { ...league, href: generateLeagueSlug(league.name, league.id) }
      : null;
  }, [standings]);

  const TABS = [
    { name: "Fixtures", icon: CalendarClock },
    { name: "Squad", icon: Users },
    ...(primaryLeague ? [{ name: "Standings", icon: ListOrdered }] : []),
    { name: "Transfers", icon: Repeat },
    { name: "Highlights", icon: Film },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case "Squad":
        return <TeamSquadWidget squad={squad} />;
      case "Standings":
        return primaryLeague ? (
          <LeagueStandingsWidget
            initialStandings={standings[0].league.standings}
            leagueSeasons={[]}
            currentSeason={primaryLeague.season}
            isLoading={false}
            hideSeasonDropdown={true}
            leagueId={primaryLeague.id}
            leagueSlug={primaryLeague.href.split("/").pop()}
          />
        ) : null;
      case "Transfers":
        return <TeamTransfersTab transfers={transfers} currentTeam={team} />;
      case "Highlights":
        return <TeamHighlightsTab highlights={highlights} />;
      case "Fixtures":
      default:
        return <TeamFixturesWidget fixtures={fixtures} />;
    }
  };

  return (
    <div className="space-y-6">
      <TeamHeader
        team={team}
        countryFlag={fixtures?.[0]?.league?.flag || ""}
        foundedText={t("founded_in", { year: team.founded })}
      />

      {/* --- CORE CHANGE: Added overflow-x-auto and scrollbar-hide --- */}
      <div className="bg-brand-secondary rounded-lg p-2 flex items-center space-x-2 sticky top-[88px] z-30 overflow-x-auto scrollbar-hide">
        {TABS.map((tab) => (
          <button
            key={tab.name}
            onClick={() => setActiveTab(tab.name)}
            // --- CORE CHANGE: Removed flex-1 and added flex-shrink-0 ---
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

      <div className="min-h-[400px]">
        <Suspense
          fallback={
            <div className="w-full h-96 bg-brand-secondary rounded-lg animate-pulse"></div>
          }
        >
          {renderTabContent()}
        </Suspense>
      </div>
    </div>
  );
}
