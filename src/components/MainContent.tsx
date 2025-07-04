"use client";

import { useState, Dispatch, SetStateAction } from "react";
import { useLeagueContext } from "@/context/LeagueContext";
import { League } from "@/types/api-football";

// Import all the components for the layout
import MatchList from "./MatchList";
import StandingsDisplay from "./StandingsDisplay";
import NewsSection from "./NewsSection";
import MobileHomeTabs from "./MobileHomeTabs";
import LeagueDetailView from "./league-detail-view";
import AdSlotWidget from "./AdSlotWidget";

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

  // Logic for showing the league detail view (unchanged)
  if (selectedLeague) {
    return (
      <div className="flex-1 p-4 lg:p-8">
        <LeagueDetailView leagueData={selectedLeague} />
      </div>
    );
  }

  // Main dashboard layout
  return (
    <>
      {/* --- Desktop Layout (3-column grid) --- */}
      <div className="hidden lg:grid lg:grid-cols-3 lg:gap-8 flex-1 pl-8">
        {/* Main Content Area (MatchList) */}
        <div className="lg:col-span-2 flex flex-col">
          <MatchList setLiveLeagues={setLiveLeagues} />

          <div className="container mx-auto px-4 mt-8 pb-8">
            <div className="bg-brand-secondary rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold text-white mb-4">
                Fanskor Hakkında
              </h2>
              <p className="text-brand-light text-base leading-relaxed">
                {homepageAboutSeoText}
              </p>
            </div>
          </div>
        </div>

        {/* Right Sidebar Column */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          {/* --- AD SLOT PLACED HERE --- */}
          <AdSlotWidget location="homepage_right_sidebar" />

          <StandingsDisplay />

          {/* The sticky container for ads and news */}
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

      {/* --- Mobile Layout (Tab-based) --- */}
      <div className="block lg:hidden w-full">
        <MobileHomeTabs
          liveLeagues={liveLeagues}
          setLiveLeagues={setLiveLeagues}
        />
      </div>
    </>
  );
};
