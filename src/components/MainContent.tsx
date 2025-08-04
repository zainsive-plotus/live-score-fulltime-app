// ===== src/components/MainContent.tsx =====

"use client";

import { useState } from "react";
import { useLeagueContext } from "@/context/LeagueContext";
import { League } from "@/types/api-football";
import dynamic from "next/dynamic";
import { useTranslation } from "@/hooks/useTranslation";
import LeagueDetailView from "./league-detail-view";
// Import skeletons for all dynamically loaded components
import {
  AdSlotWidgetSkeleton,
  RecentNewsWidgetSkeleton,
} from "./skeletons/WidgetSkeletons";

// --- SKELETON COMPONENTS ---
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

const LatestHighlightsSkeleton = () => (
  <div className="aspect-video w-full bg-brand-secondary rounded-lg animate-pulse"></div>
);

// --- DYNAMIC IMPORTS ---
const MatchList = dynamic(() => import("./MatchList"), {
  loading: () => <MatchListSkeleton />,
});

const StandingsDisplay = dynamic(() => import("./StandingsDisplay"), {
  loading: () => <StandingsDisplaySkeleton />,
});

const LatestHighlightsWidget = dynamic(
  () => import("./LatestHighlightsWidget"),
  {
    loading: () => <LatestHighlightsSkeleton />,
    ssr: false,
  }
);

// ***** FIX: Dynamically import the remaining heavy/below-the-fold components *****
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
  const { selectedLeague } = useLeagueContext();
  const [liveLeagues, setLiveLeagues] = useState<League[]>([]);
  const { t } = useTranslation();

  if (selectedLeague) {
    return (
      <div className="flex-1 p-4 lg:p-8">
        <LeagueDetailView leagueData={selectedLeague} />
      </div>
    );
  }

  return (
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
        {/* <LatestHighlightsWidget /> */}
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
          {/* Render the dynamically imported NewsSection */}
          <NewsSection />
        </div>
      </div>
    </div>
  );
};
