"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { format } from "date-fns";
import SidebarMatchItem, { SidebarMatchItemSkeleton } from "./SidebarMatchItem";
import { useTranslation } from "@/hooks/useTranslation";
import { Info } from "lucide-react";

interface MatchData {
  fixture: { id: number; status: { elapsed: number } };
  teams: { home: any; away: any };
  goals: { home: any; away: any };
}

// ** NEW: Fetch from the same reliable endpoint as MatchList **
const fetchLiveMatchesForSidebar = async (): Promise<MatchData[]> => {
  const dateString = format(new Date(), "yyyy-MM-dd");
  // Get a flat list of live matches for today
  const { data } = await axios.get(
    `/api/fixtures?date=${dateString}&status=live`
  );
  return data;
};

export default function LiveMatchUpdater({
  initialLiveMatches,
}: {
  initialLiveMatches: MatchData[];
}) {
  const { t } = useTranslation();

  const { data: liveMatches, isLoading } = useQuery<MatchData[]>({
    queryKey: ["sidebarLiveMatches"],
    queryFn: fetchLiveMatchesForSidebar,
    // Use the passed initial data only on first load
    initialData: initialLiveMatches,
    refetchInterval: 30000, // Poll every 30 seconds
    staleTime: 25000,
  });

  if (isLoading && !initialLiveMatches) {
    return (
      <div className="space-y-1">
        <SidebarMatchItemSkeleton />
        <SidebarMatchItemSkeleton />
        <SidebarMatchItemSkeleton />
      </div>
    );
  }

  if (!liveMatches || liveMatches.length === 0) {
    return (
      <div className="text-center py-4 px-2">
        <Info size={24} className="mx-auto text-brand-muted mb-2" />
        <p className="text-sm text-brand-muted">{t("no_matches_live")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {liveMatches.slice(0, 5).map((match) => (
        <SidebarMatchItem key={match.fixture.id} match={match} />
      ))}
    </div>
  );
}
