// ===== src/components/MainContent.tsx =====

"use client";

import { useLeagueContext } from "@/context/LeagueContext";
import dynamic from "next/dynamic";
import { useTranslation } from "@/hooks/useTranslation";
import LeagueDetailView from "./league-detail-view";
import PredictionSidebarWidget from "./PredictionSidebarWidget";

import {
  AdSlotWidgetSkeleton,
  RecentNewsWidgetSkeleton,
} from "./skeletons/WidgetSkeletons";

const MatchListSkeleton = () => (
  <div className="bg-brand-secondary rounded-lg p-4 h-[600px] animate-pulse">
    <div className="h-10 w-full bg-gray-700 rounded-md mb-4"></div>
    <div className="h-8 w-3/4 bg-gray-700 rounded-md mb-6"></div>
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-16 w-full bg-gray-700/50 rounded-lg"></div>
      ))}
    </div>
  </div>
);

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

const MatchList = dynamic(() => import("./MatchList"), {
  loading: () => <MatchListSkeleton />,
});

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

interface MainContentProps {
  sidebarAboutSeoText: string;
  homepageAboutSeoText: string;
}

export const MainContent: React.FC<MainContentProps> = ({
  sidebarAboutSeoText,
  homepageAboutSeoText,
}) => {
  const { selectedLeague } = useLeagueContext(); // CHANGE: Read selected league from context
  const { t } = useTranslation();

  // CHANGE: Conditional rendering logic.
  // If a league is selected in the context, show the LeagueDetailView.
  // Otherwise, show the default homepage content.
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
  );
};
