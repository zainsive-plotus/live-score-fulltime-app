"use client";

import { useEffect, useMemo, useState, Dispatch, SetStateAction } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import Image from "next/image";
import { useLeagueContext } from "@/context/LeagueContext";
import { useTranslation } from "@/hooks/useTranslation";
import { League } from "@/types/api-football";
import MatchListItem, { MatchListItemSkeleton } from "./MatchListItem";
import MatchDateNavigator from "./MatchDateNavigator";
import { Globe, ChevronsDown } from "lucide-react";
import { format } from "date-fns";

type StatusFilter = "all" | "live" | "finished" | "scheduled";
const STATUS_MAP: Record<StatusFilter, string[]> = {
  all: [],
  live: ["1H", "HT", "2H", "ET", "P", "LIVE"],
  finished: ["FT", "AET", "PEN"],
  scheduled: ["NS", "TBD", "PST"],
};
const INITIAL_MATCHES_TO_SHOW = 3;
const MATCHES_PER_PAGE = 5;

const fetchAllMatches = async (
  leagueId: number | null,
  date: Date
): Promise<any[]> => {
  const dateString = format(date, "yyyy-MM-dd");
  const url = leagueId
    ? `/api/fixtures?league=${leagueId}&date=${dateString}`
    : `/api/fixtures?date=${dateString}`;
  const { data } = await axios.get(url);
  return data;
};

const fetchGlobalLiveMatches = async (): Promise<any[]> => {
  const { data } = await axios.get("/api/global-live");
  return data;
};

const LeagueGroupHeader = ({
  league,
}: {
  league: { name: string; logo: string; country: string; flag: string | null };
}) => (
  <div
    className="flex items-center gap-3 p-3 sticky top-0 z-10"
    style={{ backgroundColor: "var(--color-primary)" }}
  >
    <div className="w-[28px] h-[28px] flex items-center justify-center">
      {league.country === "World" ? (
        <Globe size={24} className="text-text-muted" />
      ) : (
        <Image
          src={league.flag || "/default-flag.png"}
          alt={league.country}
          width={28}
          height={28}
          className="rounded-full object-cover"
        />
      )}
    </div>
    <div>
      <h3 className="font-bold text-base text-white">{league.country}</h3>
      <p className="text-sm text-text-muted">{league.name}</p>
    </div>
  </div>
);

const TabButton = ({
  label,
  isActive,
  liveCount,
  onClick,
  hasLiveIndicator,
}: {
  label: string;
  isActive: boolean;
  liveCount?: number;
  onClick: () => void;
  hasLiveIndicator?: boolean;
}) => (
  <button
    onClick={onClick}
    className={`relative flex-1 md:flex-none flex items-center justify-center gap-2 px-3 md:px-4 py-2.5 rounded-lg text-xs md:text-sm font-bold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-purple/50 ${
      isActive
        ? "bg-brand-purple text-white shadow-lg"
        : "bg-transparent text-text-muted hover:text-white"
    }`}
  >
    {hasLiveIndicator && (
      <span className="relative flex h-3 w-3">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-3 w-3 bg-brand-live"></span>
      </span>
    )}
    {label}
    {liveCount && liveCount > 0 && (
      <span className="ml-1 flex items-center justify-center text-[10px] font-bold text-white bg-brand-live rounded-full h-4 w-4">
        {liveCount}
      </span>
    )}
  </button>
);

export default function MatchList({
  setLiveLeagues,
}: {
  setLiveLeagues: Dispatch<SetStateAction<League[]>>;
}) {
  const { selectedLeague } = useLeagueContext();
  const { t } = useTranslation();
  const [activeStatusFilter, setActiveStatusFilter] =
    useState<StatusFilter>("all");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [visibleMatchCounts, setVisibleMatchCounts] = useState<
    Record<string, number>
  >({});

  // Query for matches based on selected date (for 'all', 'finished', 'scheduled' tabs)
  const {
    data: allMatches,
    isLoading,
    error,
  } = useQuery({
    queryKey: [
      "allMatches",
      selectedLeague?.id || "global",
      format(selectedDate, "yyyy-MM-dd"),
    ],
    queryFn: () => fetchAllMatches(selectedLeague?.id || null, selectedDate),
    // This query should NOT run when the 'live' tab is active
    enabled: activeStatusFilter !== "live",
    refetchInterval: 30000,
  });

  // +++ START: ADDED NEW DEDICATED QUERY FOR THE LIVE MATCH LIST
  // Query for live matches (only runs when 'live' tab is active)
  const { data: liveMatchesData, isLoading: isLoadingLive } = useQuery({
    queryKey: ["globalLiveMatchesList"],
    queryFn: fetchGlobalLiveMatches,
    // This is the key: only enable this query when the user wants to see live matches.
    enabled: activeStatusFilter === "live",
    refetchInterval: 30000,
  });
  // +++ END: ADDED NEW DEDICATED QUERY FOR THE LIVE MATCH LIST

  // Query for the global live match count (for the badge on the tab)
  const { data: globalLiveCount } = useQuery({
    queryKey: ["globalLiveCount"],
    queryFn: fetchGlobalLiveMatches,
    select: (data) => data.length,
    refetchInterval: 30000,
    staleTime: 25000,
  });

  useEffect(() => {
    setVisibleMatchCounts({});
  }, [selectedDate, activeStatusFilter]);

  const groupedMatches = useMemo(() => {
    // Determine the source of matches based on the active tab
    const matchesToProcess =
      activeStatusFilter === "live" ? liveMatchesData : allMatches;

    if (!matchesToProcess) return [];

    const statusFilter = STATUS_MAP[activeStatusFilter];
    const matchesToGroup =
      statusFilter.length > 0
        ? matchesToProcess.filter((m) =>
            statusFilter.includes(m.fixture.status.short)
          )
        : matchesToProcess;

    matchesToGroup.sort((a, b) => {
      const aIsLive = STATUS_MAP.live.includes(a.fixture.status.short);
      const bIsLive = STATUS_MAP.live.includes(b.fixture.status.short);

      if (aIsLive && !bIsLive) return -1;

      if (!aIsLive && bIsLive) return 1;

      // For live matches, sort by country and league name
      if (activeStatusFilter === "live") {
        const countryComparison = a.league.country.localeCompare(
          b.league.country
        );
        if (countryComparison !== 0) return countryComparison;
        return a.league.name.localeCompare(b.league.name);
      }

      return (
        new Date(a.fixture.date).getTime() - new Date(b.fixture.date).getTime()
      );
    });

    return matchesToGroup.reduce((acc, match) => {
      const leagueId = match.league.id;
      if (!acc[leagueId])
        acc[leagueId] = { leagueInfo: match.league, matches: [] };
      acc[leagueId].matches.push(match);
      return acc;
    }, {} as Record<string, { leagueInfo: any; matches: any[] }>);
  }, [allMatches, liveMatchesData, activeStatusFilter]); // ++ UPDATED dependencies

  useEffect(() => {
    if (allMatches) {
      const live = allMatches.filter((m) =>
        STATUS_MAP.live.includes(m.fixture.status.short)
      );
      const uniqueLeagues = Array.from(
        new Map(live.map((m) => [m.league.id, m.league])).values()
      ).map((l) => ({
        id: l.id,
        name: l.name,
        logoUrl: l.logo,
        countryName: l.country,
        countryFlagUrl: l.flag,
        type: l.type,
        href: "",
      }));
      setLiveLeagues(uniqueLeagues);
    }
  }, [allMatches, setLiveLeagues]);

  const handleLoadMore = (leagueId: number) => {
    setVisibleMatchCounts((prevCounts) => ({
      ...prevCounts,
      [leagueId]:
        (prevCounts[leagueId] || INITIAL_MATCHES_TO_SHOW) + MATCHES_PER_PAGE,
    }));
  };

  if (error)
    return (
      <div className="text-center py-10 bg-primary rounded-xl">
        Could not load match data.
      </div>
    );

  const tabButtons: { key: StatusFilter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "live", label: "Live" },
    { key: "finished", label: "Finished" },
    { key: "scheduled", label: "Scheduled" },
  ];

  // ++ UPDATED loading state check
  const isCurrentlyLoading =
    (isLoading && activeStatusFilter !== "live") ||
    (isLoadingLive && activeStatusFilter === "live");

  return (
    <div className="space-y-4">
      {}
      <div
        className="flex flex-col gap-3 p-2 rounded-xl"
        style={{ backgroundColor: "var(--color-primary)" }}
      >
        {}
        <div className="flex justify-center">
          <MatchDateNavigator
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
          />
        </div>

        {}
        <div
          className="flex items-center gap-1 p-1 rounded-xl w-full"
          style={{ backgroundColor: "var(--color-secondary)" }}
        >
          {tabButtons.map((tab) => (
            <TabButton
              key={tab.key}
              label={tab.label}
              isActive={activeStatusFilter === tab.key}
              liveCount={tab.key === "live" ? globalLiveCount : undefined}
              hasLiveIndicator={
                tab.key === "live" && (globalLiveCount ?? 0) > 0
              }
              onClick={() => setActiveStatusFilter(tab.key)}
            />
          ))}
        </div>
      </div>

      {}
      <div className="space-y-4">
        {isCurrentlyLoading ? ( // ++ UPDATED loading state check
          <div
            style={{ backgroundColor: "var(--color-primary)" }}
            className="rounded-lg p-2 space-y-2"
          >
            {Array.from({ length: 10 }).map((_, i) => (
              <MatchListItemSkeleton key={i} />
            ))}
          </div>
        ) : Object.keys(groupedMatches).length > 0 ? (
          Object.values(groupedMatches).map(({ leagueInfo, matches }: any) => {
            const visibleCount =
              visibleMatchCounts[leagueInfo.id] || INITIAL_MATCHES_TO_SHOW;
            const remainingMatches = matches.length - visibleCount;
            const hasMore = remainingMatches > 0;

            return (
              <div
                key={leagueInfo.id}
                style={{ backgroundColor: "var(--color-primary)" }}
                className="rounded-lg overflow-hidden"
              >
                <LeagueGroupHeader league={leagueInfo} />
                <div className="p-2 space-y-2">
                  {matches.slice(0, visibleCount).map((match: any) => (
                    <MatchListItem key={match.fixture.id} match={match} />
                  ))}
                  {hasMore && (
                    <button
                      onClick={() => handleLoadMore(leagueInfo.id)}
                      className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-text-muted p-3 rounded-lg transition-colors hover:text-white"
                      style={{ backgroundColor: "var(--color-secondary)" }}
                    >
                      <ChevronsDown size={16} />
                      Show {Math.min(MATCHES_PER_PAGE, remainingMatches)} more
                      matches
                    </button>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div
            className="text-center py-20 rounded-lg"
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            <p className="text-white font-semibold capitalize">
              No Matches Found
            </p>
            {/* ++ UPDATED "No matches" message */}
            <p className="text-sm text-text-muted mt-1">
              {activeStatusFilter === "live"
                ? "There are no matches currently live."
                : `There are no ${
                    activeStatusFilter !== "all" ? activeStatusFilter : ""
                  } matches for the selected date.`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
