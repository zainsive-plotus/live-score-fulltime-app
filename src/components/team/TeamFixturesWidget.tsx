// ===== src/components/team/TeamFixturesWidget.tsx =====

"use client";

import { useState, useMemo } from "react";
import { Info, CalendarClock } from "lucide-react";
import MatchListItem from "../MatchListItem";
import { useTranslation } from "@/hooks/useTranslation";
import MatchDateRangeNavigator from "../MatchDateRangeNavigator"; // <-- IMPORT THE NEW NAVIGATOR
import { DateRange } from "react-day-picker";
import { isWithinInterval, startOfDay, endOfDay } from "date-fns";

interface TeamFixturesWidgetProps {
  fixtures: any[];
}

export default function TeamFixturesWidget({
  fixtures,
}: TeamFixturesWidgetProps) {
  const { t } = useTranslation();

  // --- CORE CHANGE: State now manages a date range ---
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  // Filter the fixtures on the client-side based on the selected date range
  const filteredMatches = useMemo(() => {
    if (!fixtures) return [];

    // Sort all fixtures once by date
    const sortedFixtures = [...fixtures].sort(
      (a, b) =>
        new Date(b.fixture.date).getTime() - new Date(a.fixture.date).getTime()
    );

    // If no date range is selected, show all fixtures
    if (!dateRange || !dateRange.from) {
      return sortedFixtures;
    }

    // If a range is selected, filter the fixtures
    const start = startOfDay(dateRange.from);
    // Use endOfDay to make the range inclusive of the last day
    const end = dateRange.to
      ? endOfDay(dateRange.to)
      : startOfDay(dateRange.from);

    return sortedFixtures.filter((m: any) => {
      const matchDate = new Date(m.fixture.date);
      return isWithinInterval(matchDate, { start, end });
    });
  }, [fixtures, dateRange]);

  return (
    <div className="bg-brand-secondary rounded-xl">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 p-4 border-b border-gray-700/50">
        <h3 className="text-xl font-bold text-white flex items-center gap-2 flex-shrink-0">
          <CalendarClock size={22} />
          {t("match_schedule")}
        </h3>
        {/* --- CORE CHANGE: Replaced tabs with the Date Range Navigator --- */}
        <div className="w-full md:max-w-xs">
          <MatchDateRangeNavigator
            range={dateRange}
            onRangeChange={setDateRange}
          />
        </div>
      </div>

      <div className="p-2 space-y-2 max-h-[800px] overflow-y-auto custom-scrollbar">
        {!fixtures || fixtures.length === 0 ? (
          <div className="text-center py-20 text-brand-muted">
            <Info size={32} className="mx-auto mb-3" />
            <p className="font-semibold">{t("fixture_data_unavailable")}</p>
          </div>
        ) : filteredMatches.length > 0 ? (
          filteredMatches.map((match: any) => (
            <MatchListItem key={match.fixture.id} match={match} />
          ))
        ) : (
          <div className="text-center py-20 text-brand-muted">
            <Info size={32} className="mx-auto mb-3" />
            <p className="font-semibold">{t("no_matches_in_selected_range")}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Add a new translation key for the "no matches in range" message
// Example in your translations file:
// "no_matches_in_selected_range": "No matches found for the selected date range.",
