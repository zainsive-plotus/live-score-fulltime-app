// ===== src/components/match/MatchActivityClient.tsx =====
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
} from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

interface MatchEvent {
  time: { elapsed: number };
  team: { id: number; name: string; logo: string };
  player: { id: number; name: string };
  assist: { id: number | null; name: string | null };
  type: "Goal" | "Card" | "subst" | "Var";
  detail: string;
}

const fetchFixtureEvents = async (fixtureId: string): Promise<MatchEvent[]> => {
  const { data } = await axios.get(`/api/match-details?fixture=${fixtureId}`);
  return data?.events || [];
};

const getEventStyles = (type: string, detail: string) => {
  switch (type) {
    case "Goal":
      return { bg: "bg-green-500/10", iconColor: "text-green-400" };
    case "Card":
      return detail.includes("Yellow")
        ? { bg: "bg-yellow-500/10", iconColor: "text-yellow-400" }
        : { bg: "bg-red-500/10", iconColor: "text-red-400" };
    case "subst":
      return { bg: "bg-blue-500/10", iconColor: "text-blue-400" };
    default:
      return { bg: "bg-gray-500/10", iconColor: "text-gray-400" };
  }
};

const EventRow = memo(
  ({
    event,
    t,
  }: {
    event: MatchEvent;
    t: (key: string, params?: any) => string;
  }) => {
    const styles = getEventStyles(event.type, event.detail);
    const Icon =
      event.type === "Goal"
        ? Goal
        : event.type === "Card"
        ? RectangleVertical
        : event.type === "subst"
        ? ArrowLeftRight
        : Clock;
    const assistText = event.assist.name
      ? t("assist_by", { name: event.assist.name })
      : "";

    return (
      <div className="relative">
        <div
          className={`absolute -left-[38px] top-1 w-8 h-8 rounded-full flex items-center justify-center ${styles.bg} ${styles.iconColor} border-4 border-brand-dark`}
        >
          <Icon size={16} />
        </div>
        <div>
          <p className="text-xs font-bold text-brand-muted">
            {event.time.elapsed}' - {event.detail}
          </p>
          <p className="font-semibold text-white">{event.player.name}</p>
          {event.assist.name && (
            <p className="text-sm text-brand-light">{assistText}</p>
          )}
        </div>
      </div>
    );
  }
);
EventRow.displayName = "EventRow";

export default function MatchActivityClient({
  initialEvents,
  fixtureId,
  isLive,
  activitySeoDescription,
}: {
  initialEvents: MatchEvent[];
  fixtureId: string;
  isLive: boolean;
  activitySeoDescription: string;
}) {
  const { t } = useTranslation();

  const { data: events } = useQuery<MatchEvent[]>({
    queryKey: ["fixtureEvents", fixtureId],
    queryFn: () => fetchFixtureEvents(fixtureId),
    initialData: initialEvents,
    refetchInterval: isLive ? 15000 : false,
    staleTime: isLive ? 10000 : Infinity,
  });

  const sortedEvents = useMemo(() => {
    if (!events) return [];
    return [...events].sort((a, b) => b.time.elapsed - a.time.elapsed);
  }, [events]);

  return (
    <div className="bg-brand-secondary rounded-lg shadow-lg overflow-hidden">
      <div className="p-4 md:p-6">
        <h2 className="text-2xl font-bold text-white mb-4">
          {t("match_timeline")}
        </h2>
        <p className="italic text-brand-muted leading-relaxed mb-8 text-sm">
          {activitySeoDescription}
        </p>

        {sortedEvents.length === 0 ? (
          <div className="text-center py-10 text-brand-muted">
            <Info size={32} className="mx-auto mb-3" />
            <p>{t("match_not_started")}</p>
          </div>
        ) : (
          <div className="relative border-l-2 border-gray-700/50 ml-6 pl-8 space-y-8">
            {sortedEvents.map((event, index) => (
              <EventRow
                key={`${event.time.elapsed}-${event.player.id}-${index}`}
                event={event}
                t={t}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
