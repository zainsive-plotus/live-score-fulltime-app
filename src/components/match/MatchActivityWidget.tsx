// ===== src/components/match/MatchActivityWidget.tsx =====

"use client";

import { useQuery } from "@tanstack/react-query";
import { memo, useMemo } from "react";
import axios from "axios";
import {
  Clock,
  Goal,
  ArrowLeftRight,
  RectangleVertical,
  Info,
  Shield,
  Video,
  Flag,
} from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

interface MatchEvent {
  time: { elapsed: number; extra: number | null };
  team: { id: number; name: string; logo: string };
  player: { id: number; name: string };
  assist: { id: number | null; name: string | null };
  type: "Goal" | "Card" | "subst" | "Var";
  detail: string;
}

const fetchFixtureEvents = async (fixtureId: string): Promise<MatchEvent[]> => {
  if (!fixtureId) return [];
  const { data } = await axios.get(`/api/match-details?fixture=${fixtureId}`);
  return data?.fixture?.events || [];
};

const getEventStyles = (type: string, detail: string) => {
  switch (type) {
    case "Goal":
      return {
        Icon: Goal,
        color: "text-green-400",
        border: "border-green-500",
      };
    case "Card":
      return detail.includes("Yellow")
        ? {
            Icon: RectangleVertical,
            color: "text-yellow-400",
            border: "border-yellow-500",
          }
        : {
            Icon: RectangleVertical,
            color: "text-red-400",
            border: "border-red-500",
          };
    case "subst":
      return {
        Icon: ArrowLeftRight,
        color: "text-blue-400",
        border: "border-blue-500",
      };
    case "Var":
      return {
        Icon: Video,
        color: "text-purple-400",
        border: "border-purple-500",
      };
    default:
      return { Icon: Clock, color: "text-gray-400", border: "border-gray-500" };
  }
};

const EventRow = memo(
  ({ event, isHomeTeam }: { event: MatchEvent; isHomeTeam: boolean }) => {
    const { Icon, color, border } = getEventStyles(event.type, event.detail);

    const eventTime = `${event.time.elapsed}${
      event.time.extra ? `+${event.time.extra}` : ""
    }'`;

    return (
      <div
        className={`flex relative ${
          isHomeTeam ? "justify-start" : "justify-end"
        }`}
      >
        {/* Connector line from timeline to card */}
        <div
          className={`absolute top-5 h-px w-[calc(50%-1.5rem)] bg-gray-700/50 ${
            isHomeTeam ? "right-1/2" : "left-1/2"
          }`}
        ></div>

        {/* The Event Card */}
        <div
          className={`w-[calc(50%-1.5rem)] relative p-3 rounded-lg border-l-4 bg-white/5 backdrop-blur-sm shadow-md ${border}`}
        >
          {/* The arrow pointing to the timeline */}
          <div
            className={`absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-gray-800 rotate-45 ${
              isHomeTeam ? "right-[-7px]" : "left-[-7px]"
            }`}
          ></div>

          <div className="flex items-start gap-3">
            <Icon size={20} className={`${color} flex-shrink-0 mt-0.5`} />
            <div className="min-w-0">
              <p className="font-bold text-white text-sm truncate">
                {event.player.name}
              </p>
              <p className="text-xs text-brand-light truncate">
                {event.detail}
              </p>
              {event.assist.name && (
                <p className="text-xs text-brand-muted truncate">
                  Assist: {event.assist.name}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* The dot on the timeline */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-brand-dark rounded-full border-2 border-gray-700">
          <span className="text-xs font-mono font-bold text-brand-muted">
            {eventTime}
          </span>
        </div>
      </div>
    );
  }
);
EventRow.displayName = "EventRow";

const PeriodHeader = ({
  period,
  t,
}: {
  period: string;
  t: (key: string) => string;
}) => {
  const periodTranslations: Record<string, string> = {
    HT: t("half_time"),
    FT: t("full_time"),
  };
  const text = periodTranslations[period] || period;
  return (
    <div className="flex items-center gap-4 my-4">
      <div className="flex-grow h-px bg-gray-700"></div>
      <span className="text-xs font-bold text-brand-muted uppercase tracking-wider">
        {text}
      </span>
      <div className="flex-grow h-px bg-gray-700"></div>
    </div>
  );
};

const ActivitySkeleton = () => (
  <div className="bg-brand-secondary rounded-lg shadow-lg overflow-hidden animate-pulse p-6 min-h-[400px]">
    <div className="h-8 w-1/3 bg-gray-700 rounded mb-4"></div>
    <div className="h-4 w-full bg-gray-600 rounded mb-8"></div>
    <div className="relative mx-auto w-0.5 h-[200px] bg-gray-700/50">
      {/* Skeleton Event Left */}
      <div className="absolute top-8 right-6 w-[calc(50vw-5rem)] max-w-[200px] h-20 bg-gray-700/50 rounded-lg"></div>
      {/* Skeleton Event Right */}
      <div className="absolute top-32 left-6 w-[calc(50vw-5rem)] max-w-[200px] h-20 bg-gray-700/50 rounded-lg"></div>
    </div>
  </div>
);

export default function MatchActivityWidget({
  fixtureId,
  isLive,
  homeTeamId,
  activitySeoDescription,
}: {
  fixtureId: string;
  isLive: boolean;
  homeTeamId: number;
  activitySeoDescription: string;
}) {
  const { t } = useTranslation();

  const {
    data: events,
    isLoading,
    isError,
  } = useQuery<MatchEvent[]>({
    queryKey: ["fixtureEvents", fixtureId],
    queryFn: () => fetchFixtureEvents(fixtureId),
    refetchInterval: isLive ? 15000 : false,
    staleTime: isLive ? 10000 : Infinity,
    enabled: !!fixtureId,
  });

  const timelineItems = useMemo(() => {
    if (!events) return [];

    const sorted = [...events].sort((a, b) => a.time.elapsed - b.time.elapsed);
    const items: (MatchEvent | { type: "PeriodSeparator"; detail: string })[] =
      [];

    let lastPeriod = "1H";
    items.push({ type: "PeriodSeparator", detail: "Match Started" });

    sorted.forEach((event) => {
      if (event.time.elapsed > 45 && lastPeriod === "1H") {
        items.push({ type: "PeriodSeparator", detail: "HT" });
        lastPeriod = "2H";
      }
      if (event.time.elapsed > 90 && lastPeriod === "2H") {
        items.push({ type: "PeriodSeparator", detail: "FT" });
        lastPeriod = "ET"; // Extra Time
      }
      items.push(event);
    });

    if (isLive && sorted.length > 0) {
      // No end marker for live games
    } else if (sorted.length > 0) {
      items.push({ type: "PeriodSeparator", detail: "FT" });
    }

    return items.reverse();
  }, [events, isLive]);

  if (isLoading) return <ActivitySkeleton />;

  return (
    <div className="bg-brand-secondary rounded-lg shadow-lg overflow-hidden">
      <div className="p-4 md:p-6">
        <h2 className="text-2xl font-bold text-white mb-4">
          {t("match_timeline")}
        </h2>
        <p className="italic text-brand-muted leading-relaxed mb-8 text-sm">
          {activitySeoDescription}
        </p>

        {isError || timelineItems.length <= 2 ? (
          <div className="text-center py-10 text-brand-muted">
            <Info size={32} className="mx-auto mb-3" />
            <p>{t("match_not_started")}</p>
          </div>
        ) : (
          <div className="relative">
            <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-0.5 bg-gradient-to-t from-gray-800 to-gray-700"></div>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -mt-3 p-2 bg-gray-700 rounded-full">
              <Clock size={16} />
            </div>
            {isLive ? null : (
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 -mb-3 p-2 bg-gray-700 rounded-full">
                <Flag size={16} />
              </div>
            )}

            <div className="space-y-6 pt-4 pb-4">
              {timelineItems.map((item, index) => {
                if (item.type === "PeriodSeparator") {
                  return (
                    <PeriodHeader
                      key={`period-${index}`}
                      period={item.detail}
                      t={t}
                    />
                  );
                }
                return (
                  <EventRow
                    key={`${item.time.elapsed}-${item.player.id}-${index}`}
                    event={item}
                    isHomeTeam={item.team.id === homeTeamId}
                    t={t}
                  />
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
