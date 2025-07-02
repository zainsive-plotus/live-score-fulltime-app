// src/components/match/MatchActivityWidget.tsx
"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useMemo } from "react";
import Image from "next/image";
import {
  Clock,
  CheckCircle,
  XCircle,
  Goal,
  ArrowLeftRight,
  Slash,
} from "lucide-react";
import { format } from "date-fns";
import Link from "next/link"; // Assuming match activity events might link to players/teams

// Type definitions for events (align with API-Football's fixture events)
interface MatchEvent {
  time: {
    elapsed: number;
    extra: number | null;
  };
  team: {
    id: number;
    name: string;
    logo: string;
  };
  player: {
    id: number;
    name: string;
  };
  assist: {
    id: number | null;
    name: string | null;
  };
  type: "Goal" | "Card" | "subst" | "Var";
  detail: string; // e.g., "Yellow Card", "Red Card", "Penalty"
  comments: string | null;
}

interface MatchActivityWidgetProps {
  fixtureId: string;
  homeTeamId: number;
  awayTeamId: number;
  homeTeamLogo: string;
  awayTeamLogo: string;
  isLive: boolean; // Indicates if the match is currently live (for polling)
  activitySeoDescription: string; // <-- NEW PROP
}

const fetchFixtureEvents = async (fixtureId: string): Promise<MatchEvent[]> => {
  const { data } = await axios.get(`/api/match-details?fixture=${fixtureId}`);
  // Extract events from the full match details response
  return data?.events || [];
};

export default function MatchActivityWidget({
  fixtureId,
  homeTeamId,
  awayTeamId,
  homeTeamLogo,
  awayTeamLogo,
  isLive,
  activitySeoDescription, // <-- NEW PROP
}: MatchActivityWidgetProps) {
  const {
    data: events,
    isLoading,
    isError,
  } = useQuery<MatchEvent[]>({
    queryKey: ["fixtureEvents", fixtureId],
    queryFn: () => fetchFixtureEvents(fixtureId),
    enabled: !!fixtureId,
    // Poll for updates if match is live
    refetchInterval: isLive ? 10000 : false, // Poll every 10 seconds if live
    staleTime: isLive ? 5000 : 1000 * 60 * 5, // Data is stale after 5s if live, 5m if not
  });

  const sortedEvents = useMemo(() => {
    if (!events) return [];
    // Sort events by elapsed time ascending for chronological display
    return [...events].sort((a, b) => a.time.elapsed - b.time.elapsed);
  }, [events]);

  const EventIcon = ({ type, detail }: { type: string; detail: string }) => {
    switch (type) {
      case "Goal":
        return <Goal size={16} className="text-green-500" />;
      case "Card":
        return detail === "Yellow Card" ? (
          <Slash size={16} className="text-yellow-500 rotate-45" />
        ) : (
          <Slash size={16} className="text-red-500 rotate-45" />
        );
      case "subst":
        return <ArrowLeftRight size={16} className="text-blue-400" />;
      default:
        return <Clock size={16} className="text-brand-muted" />;
    }
  };

  if (isLoading)
    return (
      <div className="bg-brand-dark rounded-lg p-6 shadow-lg animate-pulse">
        <div className="h-6 w-3/4 bg-gray-700 rounded mb-4"></div>
        <div className="h-4 w-1/2 bg-gray-600 rounded mb-4"></div>
        <div className="space-y-2">
          <div className="h-8 bg-gray-700 rounded"></div>
          <div className="h-8 bg-gray-700 rounded"></div>
          <div className="h-8 bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  if (isError)
    return (
      <div className="bg-brand-dark rounded-lg p-6 text-red-400">
        Failed to load match activity.
      </div>
    );

  return (
    <div className="bg-brand-secondary rounded-lg shadow-lg overflow-hidden">
      <div className="p-6">
        <h2 className="text-2xl font-bold text-white mb-4">Match Activity</h2>

        {/* --- Activity SEO Optimization Text --- */}
        <p className="italic text-[#a3a3a3] leading-relaxed mb-6">
          {activitySeoDescription}
        </p>

        {sortedEvents.length === 0 ? (
          <p className="text-brand-muted text-center p-4">
            No significant match activity yet.
          </p>
        ) : (
          <div className="relative">
            {/* Vertical timeline line */}
            <div className="absolute left-1/2 transform -translate-x-1/2 w-0.5 bg-gray-700 h-full"></div>

            <div className="space-y-6">
              {sortedEvents.map((event, index) => (
                <div
                  key={index}
                  className={`flex items-center w-full ${
                    event.team.id === homeTeamId
                      ? "flex-row-reverse"
                      : "flex-row"
                  }`}
                >
                  {/* Event Time & Icon */}
                  <div
                    className={`flex items-center flex-shrink-0 w-1/2 ${
                      event.team.id === homeTeamId
                        ? "justify-end pr-6"
                        : "justify-start pl-6"
                    }`}
                  >
                    <span className="text-brand-muted text-sm flex items-center gap-1">
                      <Clock size={16} /> {event.time.elapsed}'
                    </span>
                    <div className="relative mx-3">
                      <div className="w-4 h-4 rounded-full bg-brand-purple border-2 border-gray-700 absolute top-1/2 -left-2 -translate-y-1/2"></div>
                      <EventIcon type={event.type} detail={event.detail} />
                    </div>
                  </div>

                  {/* Event Details */}
                  <div
                    className={`flex-grow w-1/2 ${
                      event.team.id === homeTeamId
                        ? "text-right pl-3"
                        : "text-left pr-3"
                    }`}
                  >
                    <div className="flex items-center gap-2 justify-end">
                      {event.team.id === homeTeamId && (
                        <Image
                          src={homeTeamLogo}
                          alt={event.team.name}
                          width={20}
                          height={20}
                          className="object-contain"
                        />
                      )}
                      <span className="font-semibold text-white">
                        {event.player.name}
                      </span>
                      {event.team.id === awayTeamId && (
                        <Image
                          src={awayTeamLogo}
                          alt={event.team.name}
                          width={20}
                          height={20}
                          className="object-contain"
                        />
                      )}
                    </div>
                    <p className="text-brand-muted text-sm">{event.detail}</p>
                    {event.comments && (
                      <p className="text-xs text-gray-500">{event.comments}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
