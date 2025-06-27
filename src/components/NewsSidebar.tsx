// src/components/NewsSidebar.tsx
"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import Slider from "react-slick";

// Import the child components and their skeletons
import LeagueStandingsSlide, {
  LeagueStandingsSlideSkeleton,
} from "./NewsLeagueStandingsSlide";
import SidebarMatchItem, { SidebarMatchItemSkeleton } from "./SidebarMatchItem";
import AdSlotWidget from "./AdSlotWidget";

// --- Type Definitions for data structures ---
interface TeamStanding {
  rank: number;
  team: { id: number; name: string; logo: string };
  points: number;
}
interface StandingsData {
  league: { id: number; name: string; logo: string };
  standings: TeamStanding[];
}
interface MatchData {
  fixture: { id: number; status: { elapsed: number } };
  teams: { home: any; away: any };
  goals: { home: any; away: any };
}

// --- API Fetcher Functions ---
const fetchGlobalLiveMatches = async (): Promise<MatchData[]> => {
  try {
    const { data } = await axios.get("/api/global-live");
    return data;
  } catch (error) {
    console.error("Error fetching global live matches for sidebar:", error);
    return [];
  }
};

// A curated list of popular league IDs to display in the slider
const POPULAR_LEAGUE_IDS = [39, 88, 140, 78, 61]; // Premier League, La Liga, Serie A, Bundesliga, Ligue 1

const fetchStandingsForLeagues = async (
  leagueIds: number[]
): Promise<StandingsData[]> => {
  try {
    const standingsPromises = leagueIds.map((id) =>
      axios.get(`/api/standings?league=${id}`).then((res) => res.data)
    );
    const results = await Promise.allSettled(standingsPromises);

    // Filter out any failed requests and leagues with no standings data
    return results
      .filter(
        (result) =>
          result.status === "fulfilled" && result.value?.standings?.length > 0
      )
      .map((result) => (result as PromiseFulfilledResult<StandingsData>).value);
  } catch (error) {
    console.error(
      "Error fetching popular league standings for sidebar:",
      error
    );
    return [];
  }
};

// --- Main Sidebar Component ---
export default function NewsSidebar() {
  const { data: liveMatches, isLoading: isLoadingMatches } = useQuery({
    queryKey: ["globalLiveMatchesSidebar"],
    queryFn: fetchGlobalLiveMatches,
    refetchInterval: 30000,
  });

  const { data: popularStandings, isLoading: isLoadingStandings } = useQuery({
    queryKey: ["popularStandingsSidebar"],
    queryFn: () => fetchStandingsForLeagues(POPULAR_LEAGUE_IDS),
    staleTime: 1000 * 60 * 60,
  });

  const sliderSettings = {
    dots: true,
    infinite: false,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 8000,
    arrows: false,
    appendDots: (dots: any) => (
      <div style={{ position: "absolute", bottom: "-25px" }}>
        <ul style={{ margin: "0px" }}> {dots} </ul>
      </div>
    ),
    customPaging: (i: any) => (
      <div className="w-2 h-2 rounded-full bg-gray-600 transition-colors duration-300 hover:bg-brand-purple active:bg-brand-purple"></div>
    ),
  };

  return (
    <aside className="space-y-8">
      {/* Live Matches Widget (no changes needed here) */}
      <section className="bg-brand-secondary rounded-xl p-4">
        <h3 className="text-lg font-bold text-brand-light mb-4">
          Live Matches
        </h3>
        <div className="space-y-1">
          {isLoadingMatches ? (
            <>
              <SidebarMatchItemSkeleton />
              <SidebarMatchItemSkeleton />
            </>
          ) : liveMatches && liveMatches.length > 0 ? (
            liveMatches
              .slice(0, 5)
              .map((match) => (
                <SidebarMatchItem
                  key={match.fixture.id}
                  match={match as MatchData}
                />
              ))
          ) : (
            <p className="text-sm text-brand-muted text-center py-4">
              No matches are currently live.
            </p>
          )}
        </div>
      </section>

      <AdSlotWidget location="news_sidebar" />

      {/* Popular League Standings Widget */}
      <section></section>
    </aside>
  );
}
