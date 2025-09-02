// ===== src/components/MainContent.tsx =====

"use client";

import { useLeagueContext } from "@/context/LeagueContext";
import dynamic from "next/dynamic";
import { useTranslation } from "@/hooks/useTranslation";
import LeagueDetailView from "./league-detail-view";
import PredictionSidebarWidget from "./PredictionSidebarWidget";
import MatchList from "./MatchList"; // Standard, non-dynamic import

import {
  AdSlotWidgetSkeleton,
  RecentNewsWidgetSkeleton,
} from "./skeletons/WidgetSkeletons";

// MatchListSkeleton is no longer needed in this file
// as MatchList now handles its own internal loading state.

const StandingsDisplaySkeleton = () => (
  <div className="bg-brand-secondary rounded-lg h-[480px] animate-pulse">
    <div className="p-2 border-b border-gray-700/50 flex space-x-1">
      <div className="flex-1 h-10 bg-gray-700 rounded-md"></div>
      <div className="flex-1 h-10 bg-gray-700 rounded-md"></div>
      <div className="flex-1 h-10 bg-gray-700 rounded-md"></div>
    </div>
    <div className="p-4 h-full"></div>
  </div>
);

const StandingsDisplay = dynamic(() => import("./StandingsDisplay"), {
  loading: () => <StandingsDisplaySkeleton />,
});

const AdSlotWidget = dynamic(() => import("./AdSlotWidget"), {
  loading: () => <AdSlotWidgetSkeleton />,
  ssr: false,
});

const NewsSection = dynamic(() => import("./NewsSection"), {
  loading: () => <RecentNewsWidgetSkeleton />,
});

interface MainContentProps {}

export const MainContent: React.FC<MainContentProps> = ({}) => {
  const { selectedLeague } = useLeagueContext();
  const { t } = useTranslation();

  // If a league is selected in the context, show the detailed view for that league.
  if (selectedLeague) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 p-4 lg:p-0 lg:pl-8">
        <div className="lg:col-span-2 flex flex-col gap-8">
          <LeagueDetailView leagueData={selectedLeague} />
        </div>
        <div className="lg:col-span-1 flex flex-col gap-6">
          <AdSlotWidget location="homepage_right_sidebar" />
          <NewsSection />
        </div>
      </div>
    );
  }

  // Otherwise, show the default homepage content with the general match list.
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 p-4 lg:p-0 lg:pl-8">
      <div className="lg:col-span-2 flex flex-col gap-8">
        <MatchList />
      </div>

      <div className="lg:col-span-1 flex flex-col gap-6">
        <AdSlotWidget location="homepage_right_sidebar" />
        <PredictionSidebarWidget />
        <StandingsDisplay />
        <div className="space-y-8 gap-8">
          <NewsSection />
        </div>
      </div>
    </div>
  );
};
