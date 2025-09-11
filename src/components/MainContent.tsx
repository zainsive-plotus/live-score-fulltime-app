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
import { DateRange } from "react-day-picker";

import {
  AdSlotWidgetSkeleton,
  RecentNewsWidgetSkeleton,
} from "./skeletons/WidgetSkeletons";

// --- CORE CHANGE: Updated fetcher to use a date range ---
const fetchFixturesByDateRange = async (range: DateRange | undefined) => {
  // Default to today if range is not set
  const from = format(range?.from || new Date(), "yyyy-MM-dd");
  const to = format(range?.to || range?.from || new Date(), "yyyy-MM-dd");

  const params = new URLSearchParams({
    from,
    to,
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

  // --- CORE CHANGE: State is now a DateRange object ---
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(),
    to: new Date(),
  });

  // Fetch all fixtures for the selected date range
  const { data: allLeagueGroups, isLoading: isLoadingFixtures } = useQuery({
    queryKey: ["allFixturesByGroup", dateRange],
    queryFn: () => fetchFixturesByDateRange(dateRange),
    staleTime: 1000 * 60 * 2, // Cache for 2 minutes
    refetchInterval: 60000, // Refetch every 60 seconds
  });

  const filteredLeagueGroups = useMemo(() => {
    if (!allLeagueGroups) return [];
    if (selectedLeagueIds.length === 0) {
      return allLeagueGroups;
    }
    return allLeagueGroups.filter((group: any) =>
      selectedLeagueIds.includes(group.leagueInfo.id)
    );
  }, [allLeagueGroups, selectedLeagueIds]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 p-4 lg:p-0 lg:pl-8">
      <div className="lg:col-span-2 flex flex-col gap-8">
        <MatchList
          leagueGroups={filteredLeagueGroups}
          isLoading={isLoadingFixtures}
          // --- CORE CHANGE: Pass the range and its setter to MatchList ---
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
        />
      </div>

      <div className="lg:col-span-1 flex flex-col gap-6">
        <div className="space-y-8 gap-8">
          <NewsSection />
        </div>
        <AdSlotWidget location="homepage_right_sidebar" />
        {/* <PredictionSidebarWidget /> */}
        <StandingsDisplay />
      </div>
    </div>
  );
};
