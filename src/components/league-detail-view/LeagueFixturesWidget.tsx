// src/components/league/LeagueFixturesWidget.tsx
"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { DayPicker } from "react-day-picker";
import { format } from "date-fns";
import { Calendar, Info } from "lucide-react";
import MatchListItem, { MatchListItemSkeleton } from "../MatchListItem";
import "react-day-picker/dist/style.css";
import { useTranslation } from "@/hooks/useTranslation";

type FixtureView = "upcoming" | "today" | "date";

// --- A SIMPLER, MORE ROBUST FETCHER ---
// This function now takes a clean parameters object.
const fetchFixtures = async (params: {
  leagueId: number;
  upcoming?: boolean;
  date?: string;
}) => {
  // URLSearchParams automatically handles building the query string correctly.
  const queryParams = new URLSearchParams({
    league: params.leagueId.toString(),
  });

  if (params.upcoming) {
    queryParams.set("upcoming", "true");
  }
  if (params.date) {
    queryParams.set("date", params.date);
  }

  const { data } = await axios.get(`/api/fixtures?${queryParams.toString()}`);
  return data;
};

export default function LeagueFixturesWidget({
  leagueId,
}: {
  leagueId: number;
}) {
  const [view, setView] = useState<FixtureView>("upcoming");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const { t } = useTranslation();

  // --- THE CORE FIX: AVOIDING COMPLEX STATE DEPENDENCIES ---
  // We use useMemo to create a stable parameters object based on the current view.
  // This object will be the "single source of truth" for our query.
  const queryParams = useMemo(() => {
    const baseParams = { leagueId };
    switch (view) {
      case "upcoming":
        return { ...baseParams, upcoming: true };
      case "today":
        return { ...baseParams, date: format(new Date(), "yyyy-MM-dd") };
      case "date":
        return { ...baseParams, date: format(selectedDate, "yyyy-MM-dd") };
      default:
        return { ...baseParams, upcoming: true };
    }
  }, [view, leagueId, selectedDate]);

  const {
    data: fixtures,
    isLoading,
    isError,
  } = useQuery({
    // The queryKey is now simpler and directly reflects the parameters being used.
    // When `queryParams` changes, TanStack Query knows it's a new query.
    queryKey: ["leagueFixtures", queryParams],
    queryFn: () => fetchFixtures(queryParams), // Pass the params object directly.
    enabled: !!leagueId,
    staleTime: 1000 * 60 * 5,
  });

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setView("date");
    setIsCalendarOpen(false);
  };

  const renderDateButtonText = () => {
    if (view === "date") return format(selectedDate, "do MMM");
    return "Select Date";
  };

  return (
    <div className="bg-brand-secondary rounded-xl p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-white">{t("fixtures")}</h3>
        <div className="flex items-center gap-1 bg-gray-700/50 p-1 rounded-lg">
          <button
            onClick={() => setView("upcoming")}
            className={`px-3 py-1 text-sm rounded-md font-semibold transition-colors ${
              view === "upcoming"
                ? "bg-brand-purple text-white"
                : "text-brand-muted hover:bg-gray-700"
            }`}
          >
            {t("upcoming")}
          </button>
          <button
            onClick={() => setView("today")}
            className={`px-3 py-1 text-sm rounded-md font-semibold transition-colors ${
              view === "today"
                ? "bg-brand-purple text-white"
                : "text-brand-muted hover:bg-gray-700"
            }`}
          >
            {t("today")}
          </button>
          <div className="relative">
            <button
              onClick={() => setIsCalendarOpen(!isCalendarOpen)}
              className={`flex items-center gap-1 px-3 py-1 text-sm rounded-md font-semibold transition-colors ${
                view === "date"
                  ? "bg-brand-purple text-white"
                  : "text-brand-muted hover:bg-gray-700"
              }`}
            >
              <Calendar size={14} />
              {renderDateButtonText()}
            </button>
            {isCalendarOpen && (
              <div className="absolute top-full right-0 mt-2 z-20 bg-brand-dark border border-gray-700 rounded-lg shadow-lg">
                <DayPicker
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && handleDateSelect(date)}
                  className="text-white"
                  initialFocus
                />
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="space-y-3 max-h-[600px] overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-600 pr-2">
        {isLoading &&
          Array.from({ length: 5 }).map((_, i) => (
            <MatchListItemSkeleton key={i} />
          ))}
        {isError && (
          <div className="text-center py-10 text-red-400">
            <p>{t("error_loading_fixtures")}</p>
          </div>
        )}
        {!isLoading &&
          !isError &&
          fixtures &&
          fixtures.length > 0 &&
          fixtures.map((match: any) => (
            <MatchListItem key={match.fixture.id} match={match} />
          ))}
        {!isLoading && !isError && (!fixtures || fixtures.length === 0) && (
          <div className="text-center py-10 text-brand-muted">
            <Info size={32} className="mx-auto mb-3" />
            <p>{t("no_fixtures_found")}</p>
          </div>
        )}
      </div>
    </div>
  );
}
