"use client";

import { useState, Dispatch, SetStateAction } from "react";
import { useLeagueContext } from "@/context/LeagueContext";
import { League } from "@/types/api-football";

import MatchList from "./MatchList";
import StandingsDisplay from "./StandingsDisplay";
import NewsSection from "./NewsSection";
import LeagueDetailView from "./league-detail-view";
import AdSlotWidget from "./AdSlotWidget";
import LatestHighlightsWidget from "./LatestHighlightsWidget";
import { useTranslation } from "@/hooks/useTranslation"; // <-- Import hook

interface MainContentProps {
  sidebarAboutSeoText: string;
  homepageAboutSeoText: string;
}

export const MainContent: React.FC<MainContentProps> = ({
  sidebarAboutSeoText,
  homepageAboutSeoText,
}) => {
  const { selectedLeague } = useLeagueContext();
  const [liveLeagues, setLiveLeagues] = useState<League[]>([]);
  const { t } = useTranslation(); // <-- Use hook

  if (selectedLeague) {
    // This part remains unchanged as it renders another component
    return (
      <div className="flex-1 p-4 lg:p-8">
        <LeagueDetailView leagueData={selectedLeague} />
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 p-4 lg:p-0 lg:pl-8">
        <div className="lg:col-span-2 flex flex-col gap-8">
          <MatchList setLiveLeagues={setLiveLeagues} />
          <div className="bg-brand-secondary rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-white mb-4">
              {t("about_fanskor_title")}
            </h2>
            <p className="text-brand-light text-base leading-relaxed">
              {homepageAboutSeoText}
            </p>
          </div>
        </div>

        <div className="lg:col-span-1 flex flex-col gap-6">
          <LatestHighlightsWidget />
          <AdSlotWidget location="homepage_right_sidebar" />
          <StandingsDisplay />
          <div className="space-y-8 gap-8">
            <section className="bg-brand-secondary rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold text-white mb-4">
                {t("about_fanskor_title")}
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
