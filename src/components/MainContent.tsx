// ===== src/components/MainContent.tsx =====

"use client";

import { useState, Dispatch, SetStateAction } from "react";
import { useLeagueContext } from "@/context/LeagueContext";
import { League } from "@/types/api-football";

import MatchList from "./MatchList";
import StandingsDisplay from "./StandingsDisplay";
import NewsSection from "./NewsSection";
import LeagueDetailView from "./league-detail-view";
import AdSlotWidget from "./AdSlotWidget";
import LatestHighlightsWidget from "./LatestHighlightsWidget"; // ADDED

interface MainContentProps {
  sidebarAboutSeoText: string;
  homepageAboutSeoText: any;
}

export const MainContent: React.FC<MainContentProps> = ({
  sidebarAboutSeoText,
  homepageAboutSeoText,
}) => {
  const { selectedLeague } = useLeagueContext();
  const [liveLeagues, setLiveLeagues] = useState<League[]>([]);

  if (selectedLeague) {
    return (
      <div className="flex-1 p-4 lg:p-8">
        <LeagueDetailView leagueData={selectedLeague} />
      </div>
    );
  }

  return (
    <>
      {/* Unified responsive layout for all screen sizes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 p-4 lg:p-0 lg:pl-8">
        {/* Main Column (Matches & About) */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          <MatchList setLiveLeagues={setLiveLeagues} />
          <div className="bg-brand-secondary rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-white mb-4">
              Fanskor Hakkında
            </h2>
            <p className="text-brand-light text-base leading-relaxed">
              {homepageAboutSeoText}
            </p>
          </div>
        </div>

        {/* Sidebar Column (Widgets) */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <LatestHighlightsWidget />
          <AdSlotWidget location="homepage_right_sidebar" />
          <StandingsDisplay />

          {/* ADDED: LatestHighlightsWidget placed in the sidebar */}

          <div className="space-y-8 gap-8">
            <section className="bg-brand-secondary rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold text-white mb-4">
                Fanskor Hakkında
              </h2>
              <p className="text-brand-light text-base leading-relaxed">
                {sidebarAboutSeoText}
              </p>
            </section>
            <NewsSection />
          </div>
        </div>
      </div>
    </>
  );
};
