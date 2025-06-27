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
import AdSlotWidget from "./AdSlotWidget"; // <-- IMPORT THE NEW AD WIDGET

export default function MainContent() {
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
      <div className="hidden lg:grid lg:grid-cols-3 lg:gap-8 flex-1 p-8">
        {/* Main Content Area (MatchList) */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          <MatchList setLiveLeagues={setLiveLeagues} />
        </div>

        {/* Right Sidebar Column */}
        <div className="lg:col-span-1 flex flex-col gap-8">
          <StandingsDisplay />

          {/* The sticky container for ads and news */}
          <div className="sticky top-8 space-y-8">
            {/* --- AD SLOT PLACED HERE --- */}
            <AdSlotWidget location="homepage_right_sidebar" />
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
}
