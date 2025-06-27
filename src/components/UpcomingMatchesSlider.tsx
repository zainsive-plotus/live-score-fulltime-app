// src/components/UpcomingMatchesSlider.tsx
"use client";

import Slider from "react-slick";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useLeagueContext } from "@/context/LeagueContext";

// Import both slide types
import MatchSlide from "./MatchSlide";
import FinishedMatchSlide from "./FinishedMatchSlide";

// Fetcher function - no changes needed, it still calls the same endpoint
const fetchLeagueMatches = async (leagueId: number) => {
  const { data } = await axios.get(`/api/upcoming-matches?league=${leagueId}`);
  return data;
};

// --- A new Skeleton component for the slider ---
const SliderSkeleton = () => (
    <div className="relative w-full h-64 overflow-hidden rounded-2xl bg-brand-secondary p-8 animate-pulse">
        <div className="flex h-full items-center justify-center">
            <div className="h-12 w-80 rounded bg-gray-600/50"></div>
        </div>
    </div>
);

export default function UpcomingMatchesSlider() {
  const { selectedLeague } = useLeagueContext();

  // The query now fetches either upcoming or finished matches
  const { data: matches, isLoading } = useQuery({
    queryKey: ['leagueMatches', selectedLeague?.id],
    queryFn: () => fetchLeagueMatches(selectedLeague!.id),
    enabled: !!selectedLeague, // Only run if a league is selected
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  const sliderSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 7000,
    pauseOnHover: true,
    arrows: false,
    appendDots: (dots: any) => (
      <div><ul className="-bottom-5 relative">{dots}</ul></div>
    ),
  };
  
  if (isLoading) {
    return <SliderSkeleton />;
  }

  // Handle case with no upcoming or finished matches found
  if (!matches || matches.length === 0) {
    return (
        <div className="flex h-64 items-center justify-center rounded-xl bg-brand-secondary text-brand-muted">
            No recent or upcoming matches found for this league.
        </div>
    );
  }

  return (
    <div className="w-full">
      <Slider {...sliderSettings}>
        {matches.map((match: any) => {
          // --- HERE IS THE LOGIC TO CHOOSE THE SLIDE ---
          // Check the match status to decide which component to render
          const isFinished = match.fixture.status.short === 'FT';

          return (
            <div key={match.fixture.id} className="px-1">
              {isFinished ? (
                <FinishedMatchSlide match={match} />
              ) : (
                <MatchSlide match={match} />
              )}
            </div>
          );
        })}
      </Slider>
    </div>
  );
}