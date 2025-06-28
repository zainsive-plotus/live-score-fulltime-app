// src/components/match/MatchActivityWidget.tsx
"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import Image from "next/image";
import { proxyImageUrl } from "@/lib/image-proxy";
import {
  Clock,
  Goal,
  Gavel,
  Users,
  Filter,
  Info,
  CalendarFold,
} from "lucide-react"; // Ensure Info is imported

interface MatchActivityWidgetProps {
  fixtureId: string;
  homeTeamId: number;
  awayTeamId: number;
  homeTeamLogo: string;
  awayTeamLogo: string;
  isLive: boolean;
}

type EventFilter = "all" | "goal" | "card" | "subst";

// Map event types to icons and colors
const getEventIconAndColor = (type: string, detail: string) => {
  if (type === "Goal")
    return { Icon: Goal, color: "text-green-500", bgColor: "bg-green-500/20" };
  if (type === "Card") {
    if (detail === "Yellow Card")
      return {
        Icon: Gavel,
        color: "text-yellow-500",
        bgColor: "bg-yellow-500/20",
      };
    if (detail === "Red Card")
      return { Icon: Gavel, color: "text-red-500", bgColor: "bg-red-500/20" };
  }
  if (type === "subst")
    return { Icon: Users, color: "text-blue-400", bgColor: "bg-blue-500/20" };
  return { Icon: Clock, color: "text-brand-muted", bgColor: "bg-gray-700/20" };
};

// Fetcher for match events
const fetchMatchEvents = async (fixtureId: string) => {
  const { data } = await axios.get(
    `${process.env.NEXT_PUBLIC_API_FOOTBALL_HOST}/fixtures/events?fixture=${fixtureId}`,
    {
      headers: { "x-apisports-key": process.env.NEXT_PUBLIC_API_FOOTBALL_KEY },
    }
  );
  return data.response;
};

// --- MODIFIED: Helper to get event display details (now robust against missing 'time') ---
const getEventDisplayDetails = (
  event: any,
  homeTeamId: number,
  awayTeamId: number,
  homeTeamLogo: string,
  awayTeamLogo: string
) => {
  const isHomeEvent = event.team.id === homeTeamId;
  const { Icon, color, bgColor } = getEventIconAndColor(
    event.type,
    event.detail
  );
  const teamLogo = isHomeEvent ? homeTeamLogo : awayTeamLogo;
  let description = "";
  let scoreDisplay = event.comments || "";

  // Safely get elapsed time, defaulting to 0 or '-' if not present
  const elapsed = event.time?.elapsed ?? 0;

  switch (event.type) {
    case "Goal":
      description = `${event.player?.name || "Unknown Player"} (${
        event.detail
      })`;
      if (event.goals) scoreDisplay = `${event.goals.home}-${event.goals.away}`;
      break;
    case "Card":
      description = `${event.player?.name || "Unknown Player"} (${
        event.detail
      })`;
      scoreDisplay = "";
      break;
    case "subst":
      description = `${event.player?.name || "Unknown Player"} Out, ${
        event.assist?.name || "Unknown Player"
      } In`;
      scoreDisplay = "";
      break;
    default:
      description = event.detail || "Generic Event";
      scoreDisplay = "";
      break;
  }

  return {
    eventTime: elapsed, // Use the safely accessed elapsed time for display and sorting
    isHomeEvent,
    Icon,
    color,
    bgColor,
    teamLogo,
    description,
    scoreDisplay,
    eventType: event.type.toLowerCase(),
  };
};

// Skeleton component (unchanged)
const ActivityWidgetSkeleton = () => (
  <div className="bg-brand-secondary p-4 rounded-lg animate-pulse">
    <div className="h-6 w-1/2 mb-4 bg-gray-700 rounded"></div>
    <div className="space-y-4 pt-2">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-gray-600"></div>
        <div className="h-4 w-3/4 bg-gray-600 rounded"></div>
      </div>
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-gray-600"></div>
        <div className="h-4 w-2/3 bg-gray-600 rounded"></div>
      </div>
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-gray-600"></div>
        <div className="h-4 w-3/4 bg-gray-600 rounded"></div>
      </div>
    </div>
  </div>
);

export default function MatchActivityWidget({
  fixtureId,
  homeTeamId,
  awayTeamId,
  homeTeamLogo,
  awayTeamLogo,
  isLive,
}: MatchActivityWidgetProps) {
  const [activeFilter, setActiveFilter] = useState<EventFilter>("all");

  const {
    data: events,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["matchEvents", fixtureId],
    queryFn: () => fetchMatchEvents(fixtureId),
    staleTime: 1000 * 10,
    refetchInterval: isLive ? 1000 * 15 : false,
    enabled: !!fixtureId,
  });

  // Process and filter events
  const processedEvents = useMemo(() => {
    if (!events) return [];

    // Process all events first to ensure 'eventTime' is available for sorting
    const detailedEvents = events.map((event: any) =>
      getEventDisplayDetails(
        event,
        homeTeamId,
        awayTeamId,
        homeTeamLogo,
        awayTeamLogo
      )
    );

    // Sort by eventTime (elapsed time), handling potential undefined/null values
    const sorted = [...detailedEvents].sort((a: any, b: any) => {
      const timeA = a.eventTime ?? 0;
      const timeB = b.eventTime ?? 0;
      return timeA - timeB;
    });

    // Apply filter
    return sorted.filter(
      (event: any) => activeFilter === "all" || event.eventType === activeFilter
    );
  }, [
    events,
    activeFilter,
    homeTeamId,
    awayTeamId,
    homeTeamLogo,
    awayTeamLogo,
  ]);

  // Calculate summary stats (unchanged)
  const summaryStats = useMemo(() => {
    if (!events)
      return {
        homeGoals: 0,
        awayGoals: 0,
        homeCards: 0,
        awayCards: 0,
        totalSubs: 0,
      };
    let homeGoals = 0,
      awayGoals = 0,
      homeCards = 0,
      awayCards = 0,
      totalSubs = 0;
    events.forEach((event: any) => {
      const isHome = event.team.id === homeTeamId;
      if (event.type === "Goal") {
        if (isHome) homeGoals++;
        else awayGoals++;
      } else if (event.type === "Card") {
        if (isHome) homeCards++;
        else awayCards++;
      } else if (event.type === "subst") {
        totalSubs++;
      }
    });
    return { homeGoals, awayGoals, homeCards, awayCards, totalSubs };
  }, [events, homeTeamId, awayTeamId]);

  if (isLoading) return <ActivityWidgetSkeleton />;

  if (isError || !events || events.length === 0) {
    return (
      <div className="bg-brand-secondary p-4 rounded-lg text-center">
        <h3 className="text-lg font-bold text-white mb-2">Match Activity</h3>
        <p className="text-sm text-brand-muted text-center py-4">
          No significant events to display yet.
        </p>
      </div>
    );
  }

  const filterOptions: {
    label: string;
    value: EventFilter;
    icon: React.ElementType;
  }[] = [
    { label: "All", value: "all", icon: Clock },
    { label: "Goals", value: "goal", icon: Goal },
    { label: "Cards", value: "card", icon: Gavel },
    { label: "Subs", value: "subst", icon: Users },
  ];

  return (
    <div className="bg-brand-secondary p-4 rounded-lg">
      <h3 className="text-lg font-bold text-white mb-4">Match Activity</h3>

      {/* Summary Stats Bar */}
      <div className="grid grid-cols-3 md:grid-cols-5 gap-2 text-xs font-semibold mb-4 bg-gray-800/50 p-2 rounded-md">
        <div className="text-left flex items-center gap-1">
          <Image
            src={proxyImageUrl(homeTeamLogo)}
            alt="Home"
            width={20}
            height={20}
          />
          <span className="text-white">{summaryStats.homeGoals}</span>
          <Goal size={16} className="text-green-500" />
        </div>
        <div className="text-left flex items-center gap-1">
          <span className="text-white">{summaryStats.homeCards}</span>
          <Gavel size={16} className="text-yellow-500" />
        </div>
        <div className="text-right flex items-center gap-1 justify-end">
          <Goal size={16} className="text-green-500" />
          <span className="text-white">{summaryStats.awayGoals}</span>
          <Image
            src={proxyImageUrl(awayTeamLogo)}
            alt="Away"
            width={20}
            height={20}
          />
        </div>
        <div className="hidden md:flex items-center gap-1 justify-end">
          <Gavel size={16} className="text-yellow-500" />
          <span className="text-white">{summaryStats.awayCards}</span>
        </div>
        <div className="hidden md:flex items-center gap-1 justify-end col-span-1">
          <Users size={16} className="text-blue-400" />
          <span className="text-white">{summaryStats.totalSubs}</span>
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="flex justify-between items-center bg-gray-800/50 p-1 rounded-lg mb-4">
        {filterOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => setActiveFilter(option.value)}
            className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md text-sm font-semibold transition-colors ${
              activeFilter === option.value
                ? "bg-brand-purple text-white"
                : "text-brand-muted hover:bg-gray-700/50"
            }`}
          >
            <option.icon size={16} />
            <span>{option.label}</span>
          </button>
        ))}
      </div>

      {/* Timeline Container */}
      <div className="relative pl-6 border-l-2 border-gray-700/50 max-h-96 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-600">
        {processedEvents.length > 0 ? (
          processedEvents.map((event: any, index: number) => (
            <div
              key={event.eventTime + "-" + index}
              className="mb-4 flex items-start -ml-3"
            >
              {" "}
              {/* Use eventTime for key */}
              {/* Timeline Dot & Icon */}
              <div className="absolute left-0 -translate-x-1/2 flex flex-col items-center">
                <div className="w-3 h-3 rounded-full bg-brand-purple ring-2 ring-brand-secondary mt-1.5"></div>
                <CalendarFold size={16} className={`${event.color} mt-1`} />
              </div>
              {/* Event Content */}
              <div className="flex-1 ml-6 bg-gray-800/30 p-3 rounded-lg flex items-center justify-between">
                {/* Time & Team Logo */}
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-brand-muted w-8 flex-shrink-0">
                    {event.eventTime}'
                  </span>
                  <Image
                    src={proxyImageUrl(event.teamLogo)}
                    alt=""
                    width={24}
                    height={24}
                    className="flex-shrink-0"
                  />
                </div>

                {/* Description & Score */}
                <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
                  <p className="text-sm text-white font-semibold flex-1 truncate">
                    {event.description}
                  </p>
                  {event.type === "Goal" && event.scoreDisplay && (
                    <span className="text-xs text-brand-muted font-bold flex-shrink-0">
                      {event.scoreDisplay}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-10 text-brand-muted">
            <Info size={32} className="mx-auto mb-3" />
            <p>No events found for this filter.</p>
          </div>
        )}
      </div>
    </div>
  );
}
