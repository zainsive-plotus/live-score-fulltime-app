"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useMemo, memo } from "react";
import {
  Clock,
  Goal,
  ArrowLeftRight,
  RectangleVertical,
  Info,
} from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation"; // <-- Import hook

interface MatchEvent {
  time: { elapsed: number };
  team: { id: number; name: string; logo: string };
  player: { id: number; name: string };
  assist: { id: number | null; name: string | null };
  type: "Goal" | "Card" | "subst" | "Var";
  detail: string;
}
interface MatchActivityWidgetProps {
  fixtureId: string;
  isLive: boolean;
  homeTeamId: number;
  activitySeoDescription: string;
}

const fetchFixtureEvents = async (fixtureId: string): Promise<MatchEvent[]> => {
  // This endpoint fetches more than just events, let's keep it for now.
  const { data } = await axios.get(`/api/match-details?fixture=${fixtureId}`);
  return data?.events || [];
};

const getEventStyles = (type: string, detail: string) => {
  switch (type) {
    case "Goal":
      return {
        bg: "bg-green-500/10",
        iconColor: "text-green-400",
        glow: "shadow-lg shadow-green-500/10",
      };
    case "Card":
      return detail.includes("Yellow")
        ? { bg: "bg-yellow-500/10", iconColor: "text-yellow-400", glow: "" }
        : { bg: "bg-red-500/10", iconColor: "text-red-400", glow: "" };
    case "subst":
      return { bg: "bg-blue-500/10", iconColor: "text-blue-400", glow: "" };
    default:
      return { bg: "bg-gray-500/10", iconColor: "text-gray-400", glow: "" };
  }
};

const EventIcon = memo(({ type, detail }: { type: string; detail: string }) => {
  const styles = getEventStyles(type, detail);
  const Icon =
    type === "Goal"
      ? Goal
      : type === "Card"
      ? RectangleVertical
      : type === "subst"
      ? ArrowLeftRight
      : Clock;
  return (
    <div
      className={`w-10 h-10 rounded-full flex items-center justify-center ${styles.bg} ${styles.iconColor}`}
    >
      <Icon size={18} />
    </div>
  );
});
EventIcon.displayName = "EventIcon";

const EventRow = memo(
  ({
    event,
    isHomeEvent,
    t,
  }: {
    event: MatchEvent;
    isHomeEvent: boolean;
    t: (key: string, params?: any) => string;
  }) => {
    const styles = getEventStyles(event.type, event.detail);
    const cardBaseClasses = `relative ${styles.bg} ${styles.glow} p-3 rounded-lg w-full max-w-xs transition-transform hover:scale-105`;
    const alignmentClasses = isHomeEvent ? "text-right" : "text-left";

    const assistText = event.assist.name
      ? t("assist_by", { name: event.assist.name })
      : "";

    const eventContent = (
      <div className={`${cardBaseClasses} ${alignmentClasses}`}>
        <p className="font-bold text-white text-sm">{event.player.name}</p>
        {event.type === "subst" ? (
          <p className="text-xs text-text-muted">
            <span className="text-red-400">{t("substitution_out_short")}</span>{" "}
            →{" "}
            <span className="text-green-400">{t("substitution_in_short")}</span>{" "}
            {event.assist.name}
          </p>
        ) : (
          <p className="text-xs text-text-muted">
            {event.detail} {assistText}
          </p>
        )}
      </div>
    );

    return (
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 md:gap-4">
        <div
          className={`flex justify-end ${
            !isHomeEvent && "opacity-0 pointer-events-none"
          }`}
        >
          {isHomeEvent && eventContent}
        </div>
        <div className="z-10 flex-shrink-0 flex items-center justify-center text-sm font-bold text-text-muted bg-brand-secondary h-12 w-12 rounded-full border-4 border-brand-dark">
          <span className="z-20">{event.time.elapsed}'</span>
        </div>
        <div
          className={`flex justify-start ${
            isHomeEvent && "opacity-0 pointer-events-none"
          }`}
        >
          {!isHomeEvent && eventContent}
        </div>
      </div>
    );
  }
);
EventRow.displayName = "EventRow";

export default function MatchActivityWidget({
  fixtureId,
  isLive,
  homeTeamId,
  activitySeoDescription,
}: MatchActivityWidgetProps) {
  const { t } = useTranslation();
  const {
    data: events,
    isLoading,
    isError,
  } = useQuery<MatchEvent[]>({
    queryKey: ["fixtureEvents", fixtureId],
    queryFn: () => fetchFixtureEvents(fixtureId),
    enabled: !!fixtureId,
    refetchInterval: isLive ? 15000 : false,
    staleTime: isLive ? 10000 : 1000 * 60 * 10,
  });

  const sortedEvents = useMemo(() => {
    if (!events) return [];
    return [...events].sort((a, b) => a.time.elapsed - b.time.elapsed);
  }, [events]);

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-3 animate-pulse">
              <div className="flex-1 space-y-2 text-right">
                <div className="h-4 w-3/4 ml-auto bg-gray-700 rounded"></div>
                <div className="h-3 w-1/2 ml-auto bg-gray-700 rounded"></div>
              </div>
              <div className="w-12 h-12 rounded-full bg-gray-700"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 bg-gray-700 rounded"></div>
                <div className="h-3 w-1/2 bg-gray-700 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      );
    }
    if (isError) {
      return (
        <div className="text-center py-10 text-red-400">
          <p>{t("error_loading_activity")}</p>
        </div>
      );
    }
    if (sortedEvents.length === 0) {
      return (
        <div className="text-center py-10 text-brand-muted">
          <Info size={32} className="mx-auto mb-3" />
          <p>{t("match_not_started")}</p>
        </div>
      );
    }
    return (
      <div className="relative">
        <div className="absolute top-0 left-1/2 h-full w-0.5 -translate-x-1/2 bg-gray-700/50"></div>
        <div className="space-y-4">
          {sortedEvents.map((event, index) => (
            <EventRow
              key={`${event.time.elapsed}-${event.player.id}-${index}`}
              event={event}
              isHomeEvent={event.team.id === homeTeamId}
              t={t}
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-brand-secondary rounded-lg shadow-lg overflow-hidden">
      <div className="p-4 md:p-6">
        <h2 className="text-2xl font-bold text-white mb-4">
          {t("match_timeline")}
        </h2>
        <p className="italic text-[#a3a3a3] leading-relaxed mb-8 text-sm">
          {activitySeoDescription}
        </p>
        {renderContent()}
      </div>
    </div>
  );
}
