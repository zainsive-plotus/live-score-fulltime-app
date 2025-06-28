// src/components/match/LiveOddsWidget.tsx
"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { TrendingUp, Goal, CornerUpRight, Users } from "lucide-react";

interface LiveOddsWidgetProps {
  fixtureId: string;
}

// --- Data Fetcher ---
const fetchLiveOdds = async (fixtureId: string) => {
  const { data } = await axios.get(
    `/api/live-odds-by-fixture?fixture=${fixtureId}`
  );
  return data;
};

// --- Reusable Sub-components for clean code ---
const OddsMarketRow = ({
  title,
  icon: Icon,
  oddsData,
  labels,
}: {
  title: string;
  icon: React.ElementType;
  oddsData: any | null;
  labels: { [key: string]: string };
}) => {
  if (!oddsData) return null;

  return (
    <div>
      <h4 className="flex items-center gap-2 text-sm font-semibold text-brand-light mb-2">
        <Icon size={16} className="text-brand-purple" />
        {title} {oddsData.handicap && `(${oddsData.handicap})`}
      </h4>
      <div className="grid grid-cols-2 gap-2">
        {Object.keys(labels).map(
          (key) =>
            oddsData[key] && (
              <div
                key={key}
                className="bg-gray-800/50 p-2 rounded-md flex justify-between items-center text-xs"
              >
                <span className="text-brand-muted">{labels[key]}</span>
                <span className="font-bold text-white">{oddsData[key]}</span>
              </div>
            )
        )}
      </div>
    </div>
  );
};

const LiveOddsSkeleton = () => (
  <div className="bg-brand-secondary p-4 rounded-lg animate-pulse">
    <div className="h-5 w-3/4 mb-4 bg-gray-700 rounded"></div>
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="h-4 w-1/2 bg-gray-600 rounded"></div>
        <div className="grid grid-cols-2 gap-2">
          <div className="h-9 bg-gray-700/50 rounded-md"></div>
          <div className="h-9 bg-gray-700/50 rounded-md"></div>
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-4 w-1/2 bg-gray-600 rounded"></div>
        <div className="grid grid-cols-2 gap-2">
          <div className="h-9 bg-gray-700/50 rounded-md"></div>
          <div className="h-9 bg-gray-700/50 rounded-md"></div>
        </div>
      </div>
    </div>
  </div>
);

export default function LiveOddsWidget({ fixtureId }: LiveOddsWidgetProps) {
  const {
    data: liveOdds,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["liveOdds", fixtureId],
    queryFn: () => fetchLiveOdds(fixtureId),
    staleTime: 10 * 1000, // 10 seconds
    refetchInterval: 20 * 1000, // Refetch every 20 seconds
    enabled: !!fixtureId,
  });

  // Don't render if there's an error or no data after loading
  if (!isLoading && (isError || !liveOdds)) {
    return null;
  }

  if (isLoading) {
    return <LiveOddsSkeleton />;
  }

  return (
    <div className="bg-brand-secondary p-4 rounded-lg">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp size={20} className="text-green-400" />
        <h3 className="text-lg font-bold text-white">Live Odds</h3>
        <span className="relative flex h-3 w-3 ml-auto">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
        </span>
      </div>

      <div className="space-y-4">
        <OddsMarketRow
          title="Over / Under"
          icon={Goal}
          oddsData={liveOdds.overUnder}
          labels={{ over: "Over", under: "Under" }}
        />
        <OddsMarketRow
          title="Asian Handicap"
          icon={Users}
          oddsData={liveOdds.asianHandicap}
          labels={{ home: "Home", away: "Away" }}
        />
        <OddsMarketRow
          title="Match Corners"
          icon={CornerUpRight}
          oddsData={liveOdds.matchCorners}
          labels={{ over: "Over", under: "Under" }}
        />
        {/* You could add more markets like 'Next Goal' here if desired */}
      </div>
    </div>
  );
}
