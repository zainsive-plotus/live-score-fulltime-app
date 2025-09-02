"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { format, Locale } from "date-fns";
import { enUS, tr, fr, es } from "date-fns/locale"; // <-- Import locales
import { Calendar, Info } from "lucide-react";
import MatchListItem, { MatchListItemSkeleton } from "../MatchListItem";
import { useTranslation } from "@/hooks/useTranslation";

type FixtureView = "upcoming" | "today" | "date";

const dateLocales: Record<string, Locale> = { en: enUS, tr, fr, es };

const fetchFixtures = async (params: {
  leagueId: number;
  upcoming?: boolean;
  date?: string;
}) => {
  const queryParams = new URLSearchParams({
    league: params.leagueId.toString(),
  });
  // The API doesn't have an 'upcoming' param, we handle this logic in MatchList
  // For simplicity here, we can just fetch for a specific date or default to today
  if (params.date) queryParams.set("date", params.date);
  const { data } = await axios.get(`/api/fixtures?${queryParams.toString()}`);
  return data;
};

export default function LeagueFixturesWidget({
  leagueId,
  season,
}: {
  leagueId: number;
  season: number;
}) {
  const [view, setView] = useState<FixtureView>("today");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);
  const { t, locale } = useTranslation();

  const queryParams = useMemo(() => {
    const baseParams = { leagueId, season };
    switch (view) {
      case "today":
        return { ...baseParams, date: format(new Date(), "yyyy-MM-dd") };
      case "date":
        return { ...baseParams, date: format(selectedDate, "yyyy-MM-dd") };
      // Fallback for upcoming or other views if needed in future
      default:
        return { ...baseParams, date: format(new Date(), "yyyy-MM-dd") };
    }
  }, [view, leagueId, season, selectedDate]);

  const {
    data: fixtures,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["leagueFixtures", queryParams],
    queryFn: () => fetchFixtures(queryParams),
    enabled: !!leagueId,
    staleTime: 1000 * 60 * 5,
  });

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        calendarRef.current &&
        !calendarRef.current.contains(event.target as Node)
      ) {
        setIsCalendarOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [calendarRef]);

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      setView("date");
      setIsCalendarOpen(false);
    }
  };

  const renderDateButtonText = () => {
    const currentLocale = dateLocales[locale] || enUS;
    if (view === "date")
      return format(selectedDate, "do MMM", { locale: currentLocale });
    return t("select_date");
  };

  const currentLocale = dateLocales[locale] || enUS;

  return (
    <div className="bg-brand-secondary rounded-xl">
      <div className="flex justify-between items-center p-4 border-b border-gray-700/50">
        <h3 className="text-xl font-bold text-white">{t("fixtures")}</h3>
        <div className="flex items-center gap-1 bg-[var(--color-primary)] p-1 rounded-lg">
          <button
            onClick={() => setView("today")}
            className={`px-3 py-1 text-sm rounded-md font-semibold transition-colors ${
              view === "today"
                ? "bg-[var(--brand-accent)] text-white"
                : "text-text-muted hover:bg-gray-700"
            }`}
          >
            {t("today")}
          </button>
          <div className="relative" ref={calendarRef}>
            <button
              onClick={() => setIsCalendarOpen(!isCalendarOpen)}
              className={`flex items-center gap-1.5 px-3 py-1 text-sm rounded-md font-semibold transition-colors capitalize ${
                view === "date"
                  ? "bg-[var(--brand-accent)] text-white"
                  : "text-text-muted hover:bg-gray-700"
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
                  onSelect={handleDateSelect}
                  className="text-white"
                  initialFocus
                  locale={currentLocale}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="p-2 space-y-2 max-h-[600px] overflow-y-auto custom-scrollbar">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <MatchListItemSkeleton key={i} />
          ))
        ) : isError ? (
          <div className="text-center py-10 text-red-400">
            <p>{t("error_loading_fixtures")}</p>
          </div>
        ) : fixtures && fixtures.length > 0 ? (
          fixtures.map((match: any) => (
            <MatchListItem key={match.fixture.id} match={match} />
          ))
        ) : (
          <div className="text-center py-20 text-brand-muted">
            <Info size={32} className="mx-auto mb-3" />
            <p className="font-semibold">{t("no_fixtures_found")}</p>
          </div>
        )}
      </div>
    </div>
  );
}
