// ===== src/components/league-detail-view/LeagueFixturesWidget.tsx =====

"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";
import { Info, CalendarClock, Loader2 } from "lucide-react";
import MatchListItem, { MatchListItemSkeleton } from "../MatchListItem";
import { useTranslation } from "@/hooks/useTranslation";
import MatchDateRangeNavigator from "../MatchDateRangeNavigator"; // <-- IMPORT THE NAVIGATOR

interface LeagueFixturesWidgetProps {
  leagueId: number;
  season: number;
}

// Updated fetcher to accept a date range
const fetchFixtures = async (params: {
  leagueId: number;
  season: number;
  from: string;
  to: string;
}) => {
  const queryParams = new URLSearchParams({
    league: params.leagueId.toString(),
    season: params.season.toString(),
    from: params.from,
    to: params.to,
  });
  const { data } = await axios.get(`/api/fixtures?${queryParams.toString()}`);
  return data;
};

export default function LeagueFixturesWidget({
  leagueId,
  season,
}: LeagueFixturesWidgetProps) {
  const { t } = useTranslation();

  // --- CORE CHANGE: State now manages a DateRange object ---
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(),
    to: new Date(),
  });

  const queryParams = useMemo(
    () => ({
      leagueId,
      season,
      from: format(dateRange?.from || new Date(), "yyyy-MM-dd"),
      to: format(dateRange?.to || dateRange?.from || new Date(), "yyyy-MM-dd"),
    }),
    [leagueId, season, dateRange]
  );

  const {
    data: fixtures,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["leagueFixtures", queryParams],
    queryFn: () => fetchFixtures(queryParams),
    enabled: !!leagueId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return (
    <div className="bg-brand-secondary rounded-xl">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 p-4 border-b border-gray-700/50">
        <h3 className="text-xl font-bold text-white flex items-center gap-2 flex-shrink-0">
          <CalendarClock size={22} />
          {t("fixtures")}
        </h3>
        {/* --- CORE CHANGE: Replaced tabs with the Date Range Navigator --- */}
        <div className="w-full md:max-w-xs lg:max-w-sm">
          <MatchDateRangeNavigator
            range={dateRange}
            onRangeChange={setDateRange}
          />
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
