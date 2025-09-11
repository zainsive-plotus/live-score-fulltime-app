// ===== src/components/MainContent.tsx =====

"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useLeagueContext } from "@/context/LeagueContext";
import dynamic from "next/dynamic";
import PredictionSidebarWidget from "./PredictionSidebarWidget";
import MatchList from "./MatchList";
import { format } from "date-fns";

import {
  AdSlotWidgetSkeleton,
  RecentNewsWidgetSkeleton,
} from "./skeletons/WidgetSkeletons";

// --- Data fetching logic is now centralized in MainContent ---
const fetchAllFixturesByGroup = async (date: Date) => {
  const dateString = format(date, "yyyy-MM-dd");
  const params = new URLSearchParams({
    date: dateString,
    groupByLeague: "true",
  });
  const { data } = await axios.get(`/api/fixtures?${params.toString()}`);
  return data.leagueGroups || [];
};

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

export const MainContent: React.FC = () => {
  const { selectedLeagueIds } = useLeagueContext();
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Fetch all fixtures for the selected date
  const { data: allLeagueGroups, isLoading: isLoadingFixtures } = useQuery({
    queryKey: ["allFixturesByGroup", format(selectedDate, "yyyy-MM-dd")],
    queryFn: () => fetchAllFixturesByGroup(selectedDate),
    staleTime: 1000 * 60 * 2, // Cache for 2 minutes
    refetchInterval: 60000, // Refetch every 60 seconds
  });

  // --- CORE CHANGE: Filter the fetched data based on the context ---
  const filteredLeagueGroups = useMemo(() => {
    if (!allLeagueGroups) return [];
    // If no leagues are selected, show all
    if (selectedLeagueIds.length === 0) {
      return allLeagueGroups;
    }
    // Otherwise, filter to only include the selected leagues
    return allLeagueGroups.filter((group: any) =>
      selectedLeagueIds.includes(group.leagueInfo.id)
    );
  }, [allLeagueGroups, selectedLeagueIds]);

  // NOTE: The logic for the now-removed LeagueDetailView has been omitted.
  // This component now focuses solely on the MatchList display.

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 p-4 lg:p-0 lg:pl-8">
      <div className="lg:col-span-2 flex flex-col gap-8">
        <MatchList
          leagueGroups={filteredLeagueGroups}
          isLoading={isLoadingFixtures}
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
        />
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
