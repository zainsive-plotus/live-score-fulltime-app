"use client";

import { useState, useMemo, Suspense, useEffect } from "react"; // <-- Import useEffect
import { usePathname } from "next/navigation"; // <-- Import usePathname
import dynamic from "next/dynamic";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useTranslation } from "@/hooks/useTranslation";
import {
  CalendarClock,
  ListOrdered,
  Users,
  Newspaper,
  Film,
  Loader2,
  Trophy,
} from "lucide-react";

import LeagueHeader from "./LeagueHeader";
import { generateStandingsSlug } from "@/lib/generate-standings-slug";

const fetchLeagueDataForSeason = async (leagueId: number, season: number) => {
  const { data } = await axios.get(
    `/api/league-page-data?leagueId=${leagueId}&season=${season}`
  );
  return data;
};

// All dynamic imports remain the same
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
const LeagueNewsTab = dynamic(() => import("./LeagueNewsTab"));
const LeagueHighlightsTab = dynamic(() => import("./LeagueHighlightsTab"));

const DEFAULT_TAB = "teams"; // Default tab for leagues is 'Teams'

export default function LeagueDetailView({
  leagueData: initialLeagueData,
}: {
  leagueData: any;
}) {
  const { t } = useTranslation();
  const pathname = usePathname(); // Get the base path for the URL

  // Initialize state from URL hash on the client, with a fallback
  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window !== "undefined") {
      const hash = window.location.hash.replace("#", "");
      return hash || DEFAULT_TAB;
    }
    return DEFAULT_TAB;
  });

  const initialSeason = useMemo(() => {
    return (
      initialLeagueData.seasons.find((s: any) => s.current === true)?.year ||
      initialLeagueData.seasons[0]?.year
    );
  }, [initialLeagueData.seasons]);

  const [selectedSeason, setSelectedSeason] = useState<number>(initialSeason);

  const { data: leagueData, isLoading } = useQuery({
    queryKey: ["leaguePageData", initialLeagueData.league.id, selectedSeason],
    queryFn: () =>
      fetchLeagueDataForSeason(initialLeagueData.league.id, selectedSeason),
    initialData:
      selectedSeason === initialSeason ? initialLeagueData : undefined,
    staleTime: 1000 * 60 * 60,
    refetchOnWindowFocus: false,
    keepPreviousData: true,
  });

  const displayData = leagueData || initialLeagueData;
  const { league, country, seasons, standings, topScorer, news, highlights } =
    displayData;
  const availableSeasons = useMemo(
    () =>
      initialLeagueData.seasons
        .map((s: any) => s.year)
        .sort((a: number, b: number) => b - a),
    [initialLeagueData.seasons]
  );

  const TABS = useMemo(
    () => [
      { key: "teams", name: t("teams"), icon: Users },
      { key: "top_scorers", name: t("top_scorers"), icon: Trophy },
      { key: "fixtures", name: t("fixtures"), icon: CalendarClock },
      ...(league.type === "League"
        ? [{ key: "standings", name: t("standings"), icon: ListOrdered }]
        : []),
      { key: "news", name: t("news"), icon: Newspaper },
      { key: "highlights", name: t("highlights"), icon: Film },
    ],
    [league.type, t]
  );

  // Effect to synchronize URL hash with component state
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace("#", "");
      const isValidTab = TABS.some(
        (tab) => tab.key.toLowerCase() === hash.toLowerCase()
      );
      setActiveTab(isValidTab ? hash : DEFAULT_TAB);
    };

    handleHashChange(); // Set initial state correctly on mount

    window.addEventListener("hashchange", handleHashChange);
    return () => {
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, [pathname, TABS]);

  // Handler to update the URL hash on click
  const handleTabClick = (tabKey: string) => {
    window.location.hash = tabKey.toLowerCase();
  };

  const renderTabContent = () => {
    if (isLoading) {
      return (
        <div className="min-h-[400px] flex items-center justify-center bg-brand-secondary rounded-lg">
          <Loader2
            size={40}
            className="animate-spin text-[var(--brand-accent)]"
          />
        </div>
      );
    }

    switch (activeTab) {
      case "standings":
        return (
          <LeagueStandingsWidget
            initialStandings={standings}
            leagueSeasons={availableSeasons}
            currentSeason={selectedSeason}
            isLoading={isLoading}
            leagueId={league.id}
            leagueSlug={generateStandingsSlug(league.name, league.id)}
            onSeasonChange={setSelectedSeason}
          />
        );
      case "top_scorers":
        return (
          <LeagueTopScorersWidget
            leagueId={league.id}
            season={selectedSeason}
          />
        );
      case "news":
        return <LeagueNewsTab news={news} leagueName={league.name} />;
      case "highlights":
        return (
          <LeagueHighlightsTab
            initialHighlights={highlights}
            leagueName={league.name}
          />
        );
      case "fixtures":
        return (
          <LeagueFixturesWidget leagueId={league.id} season={selectedSeason} />
        );
      case "teams":
      default:
        return (
          <LeagueTeamsList
            leagueId={league.id}
            season={selectedSeason}
            countryName={country.name}
            countryFlag={country.flag}
          />
        );
    }
  };

  return (
    <div className="space-y-6">
      <LeagueHeader
        league={league}
        country={country}
        availableSeasons={availableSeasons}
        selectedSeason={selectedSeason}
        onSeasonChange={setSelectedSeason}
        isLoading={isLoading}
      />

      <div className="bg-brand-secondary rounded-lg p-2 flex items-center space-x-2 top-[88px] z-30 overflow-x-auto scrollbar-hide">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => handleTabClick(tab.key)}
            className={`flex-shrink-0 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-semibold transition-colors ${
              activeTab === tab.key
                ? "bg-[var(--brand-accent)] text-white shadow-md"
                : "text-brand-muted hover:bg-white/5 hover:text-white"
            }`}
          >
            <tab.icon size={16} />
            {tab.name}
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
