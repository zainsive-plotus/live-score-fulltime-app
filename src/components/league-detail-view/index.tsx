// ===== src/components/league-detail-view/index.tsx =====

"use client";

import { useState, Suspense } from "react";
import dynamic from "next/dynamic";
import { useTranslation } from "@/hooks/useTranslation";
import {
  Eye,
  CalendarClock,
  ListOrdered,
  Users,
  Newspaper,
  Film,
} from "lucide-react"; // <-- Import new icons

import LeagueHeader from "./LeagueHeader";
import { generateStandingsSlug } from "@/lib/generate-standings-slug";

// Dynamically import all child components for performance
const LeagueStandingsWidget = dynamic(
  () => import("@/components/league-detail-view/LeagueStandingsWidget")
);
const LeagueFixturesWidget = dynamic(
  () => import("@/components/league-detail-view/LeagueFixturesWidget")
);
const LeagueTeamsList = dynamic(
  () => import("@/components/league-detail-view/LeagueTeamsList")
);
const LeagueTopScorersWidget = dynamic(
  () => import("@/components/league-detail-view/LeagueTopScorersWidget")
);
const LeagueNewsTab = dynamic(() => import("./LeagueNewsTab")); // <-- Import new component
const LeagueHighlightsTab = dynamic(() => import("./LeagueHighlightsTab")); // <-- Import new component

const LeagueOverviewTab = ({ leagueData }: { leagueData: any }) => {
  const { league, seasons, standings } = leagueData;
  const currentSeason =
    seasons.find((s: any) => s.current === true) || seasons[0];
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-1">
      {league.type === "League" && standings.length > 0 && (
        <LeagueStandingsWidget
          initialStandings={standings}
          leagueSeasons={seasons
            .map((s: any) => s.year)
            .sort((a: number, b: number) => b - a)}
          currentSeason={currentSeason.year}
          isLoading={false}
          leagueId={league.id}
          leagueSlug={generateStandingsSlug(league.name, league.id)}
          hideSeasonDropdown={false}
        />
      )}
      <LeagueTopScorersWidget
        leagueId={league.id}
        season={currentSeason.year}
      />
    </div>
  );
};

export default function LeagueDetailView({ leagueData }: { leagueData: any }) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("Teams");

  const { league, country, seasons, news, highlights } = leagueData;
  const currentSeason =
    seasons.find((s: any) => s.current === true) || seasons[0];
  const currentSeasonYear = currentSeason.year;

  // --- CORE CHANGE: Added News and Highlights to the TABS array ---
  const TABS = [
    { name: "Teams", icon: Users },
    { name: "Fixtures", icon: CalendarClock },
    ...(league.type === "League"
      ? [{ name: "Standings", icon: ListOrdered }]
      : []),
    { name: "News", icon: Newspaper },
    { name: "Highlights", icon: Film },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case "Fixtures":
        return (
          <LeagueFixturesWidget
            leagueId={league.id}
            season={currentSeasonYear}
          />
        );
      case "Standings":
        return (
          <LeagueStandingsWidget
            initialStandings={leagueData.standings}
            leagueSeasons={seasons
              .map((s: any) => s.year)
              .sort((a: number, b: number) => b - a)}
            currentSeason={currentSeasonYear}
            isLoading={false}
            leagueId={league.id}
            leagueSlug={generateStandingsSlug(league.name, league.id)}
          />
        );
      case "Teams":
        return (
          <LeagueTeamsList
            leagueId={league.id}
            season={currentSeasonYear}
            countryName={country.name}
            countryFlag={country.flag}
          />
        );
      // --- CORE CHANGE: Added render cases for the new tabs ---
      case "News":
        return <LeagueNewsTab news={news} leagueName={league.name} />;
      case "Highlights":
        return (
          <LeagueHighlightsTab
            initialHighlights={highlights}
            leagueName={league.name}
          />
        );
    }
  };

  return (
    <div className="space-y-6">
      <LeagueHeader
        league={league}
        country={country}
        currentSeason={currentSeasonYear}
      />

      <div className="bg-brand-secondary rounded-lg p-2 flex items-center space-x-2 sticky top-[88px] z-30 overflow-x-auto scrollbar-hide">
        {TABS.map((tab) => (
          <button
            key={tab.name}
            onClick={() => setActiveTab(tab.name)}
            className={`flex-shrink-0 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-semibold transition-colors ${
              activeTab === tab.name
                ? "bg-[var(--brand-accent)] text-white shadow-md"
                : // Added a subtle hover effect for inactive tabs
                  "text-brand-muted hover:bg-white/5 hover:text-white"
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

// Add these new translation keys to your i18n files:
// "news": "News",
// "highlights": "Highlights"
