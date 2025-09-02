// ===== src/components/MatchListItem.tsx =====

"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import DesktopMatchListItem, {
  MatchListItemSkeleton as DesktopSkeleton,
} from "./DesktopMatchListItem";
import MobileMatchListItem, {
  MobileMatchListItemSkeleton as MobileSkeleton,
} from "./MobileMatchListItem";

interface MatchListItemProps {
  match: any;
}

const fetchLiveMatchData = async (fixtureId: number) => {
  if (!fixtureId) return null;
  const { data } = await axios.get(`/api/match-details?fixture=${fixtureId}`);
  return data?.fixture || null;
};

export default function MatchListItem({
  match: initialMatch,
}: MatchListItemProps) {
  // Guard clause to ensure the initial data is valid before proceeding.
  if (!initialMatch || !initialMatch.fixture || !initialMatch.teams) {
    // Log an error to the console during development to help debug API issues.
    console.error(
      "MatchListItem received invalid or missing match data.",
      initialMatch
    );
    // Render nothing for this item instead of crashing the page.
    return null;
  }

  const [match, setMatch] = useState(initialMatch);

  const status = match.fixture.status.short;
  const isLive = ["1H", "HT", "2H", "ET", "P", "LIVE"].includes(status);
  const isFinished = ["FT", "AET", "PEN"].includes(status);

  // Centralized useQuery for live updates
  const { data: newMatchData } = useQuery({
    queryKey: ["liveMatchData", match.fixture.id],
    queryFn: () => fetchLiveMatchData(match.fixture.id),
    enabled: isLive && !isFinished, // Only runs for live, unfinished matches
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 25000,
  });

  // Effect to update the local match state when new data arrives from the API
  useEffect(() => {
    if (newMatchData) {
      setMatch(newMatchData);
    }
  }, [newMatchData]);

  return (
    <>
      <div className="hidden lg:block">
        <DesktopMatchListItem match={match} isLive={isLive} />
      </div>
      <div className="block lg:hidden">
        <MobileMatchListItem match={match} />
      </div>
    </>
  );
}

export const MatchListItemSkeleton = () => {
  return (
    <>
      <div className="hidden lg:block">
        <DesktopSkeleton />
      </div>
      <div className="block lg:hidden">
        <MobileSkeleton />
      </div>
    </>
  );
};
