"use client";

import { useState, useMemo, Suspense, useEffect } from "react";
import { usePathname } from "next/navigation"; // useRouter is no longer needed
import dynamic from "next/dynamic";
import { useTranslation } from "@/hooks/useTranslation";
import { generateLeagueSlug } from "@/lib/generate-league-slug";
import TeamHeader from "./team/TeamHeader";
import {
  CalendarClock,
  Users,
  ListOrdered,
  Repeat,
  Film,
  Newspaper,
} from "lucide-react";

// All dynamic imports remain the same
const TeamSquadWidget = dynamic(() => import("./team/TeamSquadWidget"));
const TeamFixturesWidget = dynamic(() => import("./team/TeamFixturesWidget"));
const LeagueStandingsWidget = dynamic(
  () => import("@/components/league-detail-view/LeagueStandingsWidget")
);
const TeamTransfersTab = dynamic(() => import("./team/TeamTransfersTab"));
const TeamHighlightsTab = dynamic(() => import("./team/TeamHighlightsTab"));
const TeamNewsTab = dynamic(() => import("./team/TeamNewsTab"));

const DEFAULT_TAB = "Fixtures";

export default function TeamDetailView({ teamData }: { teamData: any }) {
  const { t } = useTranslation();
  const pathname = usePathname();

  // State initialization remains the same
  const [activeTab, setActiveTab] = useState(DEFAULT_TAB);

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

  const TABS = useMemo(
    () => [
      { name: "Fixtures", icon: CalendarClock },
      { name: "News", icon: Newspaper },
      { name: "Squad", icon: Users },
      ...(primaryLeague ? [{ name: "Standings", icon: ListOrdered }] : []),
      { name: "Transfers", icon: Repeat },
      { name: "Highlights", icon: Film },
    ],
    [primaryLeague]
  );

  // This useEffect is now the SINGLE SOURCE OF TRUTH for the active tab state.
  // It runs on mount and whenever the URL hash changes.
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace("#", "");
      const tabFromHash = hash.charAt(0).toUpperCase() + hash.slice(1);

      const isValidTab = TABS.some(
        (tab) => tab.name.toLowerCase() === hash.toLowerCase()
      );

      setActiveTab(isValidTab ? tabFromHash : DEFAULT_TAB);
    };

    // Set the initial state correctly on client-side mount
    handleHashChange();

    // Listen for back/forward navigation
    window.addEventListener("hashchange", handleHashChange);
    return () => {
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, [pathname, TABS]); // Re-run if the page changes

  // CORRECTED: The click handler's ONLY job is to change the URL hash.
  const handleTabClick = (tabName: string) => {
    // This assignment directly changes the URL and triggers the 'hashchange' event.
    // The useEffect above will then handle updating the state.
    window.location.hash = tabName.toLowerCase();
  };

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
        return (
          <TeamHighlightsTab
            initialHighlights={highlights}
            teamName={team.name}
          />
        );
      case "News":
        return <TeamNewsTab teamId={team.id} />;
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

      <div className="bg-brand-secondary rounded-lg p-2 flex items-center space-x-2 sticky top-[88px] z-30 overflow-x-auto scrollbar-hide">
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
