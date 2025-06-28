// src/components/DesktopMatchListItem.tsx
"use client";

import { useMemo } from "react";
import Image from "next/image";
import Link from "@/components/StyledLink";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Star } from "lucide-react";
import { generateMatchSlug } from "@/lib/generate-match-slug";
import { proxyImageUrl } from "@/lib/image-proxy"; // Make sure proxyImageUrl is imported

// --- Type Definition for Odds ---
type Odds =
  | {
      home: string;
      draw: string;
      away: string;
    }
  | undefined
  | null;

// --- API Fetcher for Pre-Match Odds ---
const fetchPreMatchOdds = async (fixtureId: number): Promise<Odds> => {
  try {
    const { data } = await axios.get(`/api/odds?fixture=${fixtureId}`);
    return data;
  } catch {
    return null;
  }
};

// --- Main Component ---
interface DesktopMatchListItemProps {
  match: any;
  liveOdds?: Odds;
  isLive: boolean;
  customOdds?: Odds; // NEW: Custom calculated odds
}

export default function DesktopMatchListItem({
  match,
  liveOdds,
  isLive,
  customOdds, // NEW: Destructure customOdds
}: DesktopMatchListItemProps) {
  const { fixture, teams, goals } = match;
  const slug = generateMatchSlug(teams.home, teams.away, fixture.id);

  const isFinished = ["FT", "AET", "PEN"].includes(fixture.status.short);

  const { data: preMatchOdds, isLoading: isLoadingPreMatchOdds } = useQuery({
    queryKey: ["preMatchOdds", fixture.id],
    queryFn: () => fetchPreMatchOdds(fixture.id),
    enabled: !isFinished && !isLive,
    staleTime: 1000 * 60 * 60,
    refetchOnWindowFocus: false,
  });

  const displayOdds = isLive ? liveOdds : preMatchOdds;

  const lowestOdd = useMemo(() => {
    if (!displayOdds) return null;
    const oddValues = [
      parseFloat(displayOdds.home),
      parseFloat(displayOdds.draw),
      parseFloat(displayOdds.away),
    ];
    return Math.min(...oddValues);
  }, [displayOdds]);

  const OddBox = ({ value }: { value: string | undefined }) => {
    const isLowest = parseFloat(value || "999") === lowestOdd;
    return (
      <div
        className={`flex items-center justify-center p-2 rounded-md w-14 h-8 text-sm font-bold transition-colors duration-200 hover:bg-gray-600 ${
          isLowest
            ? "bg-yellow-500/20 text-brand-yellow"
            : "bg-transparent text-text-secondary"
        }`}
      >
        {value || "-"}
      </div>
    );
  };

  // --- NEW: CustomOddBox for Fanskor's odds ---
  const CustomOddBox = ({ value }: { value: string | undefined }) => {
    return (
      <div className="flex items-center justify-center p-2 rounded-md w-14 h-8 text-sm font-bold bg-brand-purple/20 text-white">
        {value || "-"}
      </div>
    );
  };

  return (
    <Link
      href={`/football/match/${slug}`}
      className="group flex items-center p-2 rounded-lg transition-all duration-300 ease-in-out border border-transparent hover:-translate-y-1 hover:shadow-xl hover:shadow-[#ed5c19]/10 hover:border-[#ed5c19]"
      style={{ backgroundColor: "var(--color-secondary)" }}
    >
      {/* Column 1: Status */}
      <div className="w-16 flex-shrink-0 text-center text-sm font-semibold">
        {isLive ? (
          <div className="flex items-center justify-center gap-1.5 text-green-400">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500"></span>
            <span>{fixture.status.elapsed}'</span>
          </div>
        ) : isFinished ? (
          <div className="text-text-muted">FT</div>
        ) : (
          <div className="text-text-primary">
            {format(new Date(fixture.date), "HH:mm")}
          </div>
        )}
      </div>

      {/* Column 2: Teams */}
      <div className="flex-1 flex flex-col gap-1.5">
        <div className="flex items-center gap-3">
          <Image
            src={proxyImageUrl(teams.home.logo)}
            alt={teams.home.name}
            width={20}
            height={20}
          />
          <span className="font-semibold text-base text-text-primary">
            {teams.home.name}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Image
            src={proxyImageUrl(teams.away.logo)}
            alt={teams.away.name}
            width={20}
            height={20}
          />
          <span className="font-semibold text-base text-text-primary">
            {teams.away.name}
          </span>
        </div>
      </div>

      {/* Column 3: Odds Display (API/Live Odds) */}
      <div className="flex-1 flex items-center justify-center gap-1">
        {isFinished ? (
          <div className="h-8"></div>
        ) : isLoadingPreMatchOdds ? (
          <div className="flex items-center justify-center gap-1 w-full">
            <div
              className="w-14 h-8 rounded-md animate-pulse"
              style={{ backgroundColor: "var(--color-primary)" }}
            ></div>
            <div
              className="w-14 h-8 rounded-md animate-pulse"
              style={{ backgroundColor: "var(--color-primary)" }}
            ></div>
            <div
              className="w-14 h-8 rounded-md animate-pulse"
              style={{ backgroundColor: "var(--color-primary)" }}
            ></div>
          </div>
        ) : displayOdds ? (
          <>
            <OddBox value={displayOdds.home} />
            <OddBox value={displayOdds.draw} />
            <OddBox value={displayOdds.away} />
          </>
        ) : (
          <div className="flex items-center justify-center w-full h-8">
            <span className="text-xs font-semibold text-text-muted">
              No Odds Available
            </span>
          </div>
        )}
      </div>

      {/* --- NEW COLUMN: Fanskor Odds --- */}
      {/* This column is conditionally rendered based on `customOdds` */}
      {customOdds && !isFinished && (
        <div className="flex-1 flex flex-col items-center justify-center gap-1 text-center">
          <span className="text-xs text-brand-muted font-semibold">
            Fanskor Odds
          </span>
          <div className="flex items-center justify-center gap-1">
            <CustomOddBox value={customOdds.home} />
            <CustomOddBox value={customOdds.draw} />
            <CustomOddBox value={customOdds.away} />
          </div>
        </div>
      )}

      {/* Column 4: Scores */}
      <div
        className={`w-10 flex-shrink-0 flex flex-col items-center gap-1.5 text-base font-bold ${
          isLive ? "text-green-400" : "text-text-primary"
        }`}
      >
        <span>{goals.home ?? "-"}</span>
        <span>{goals.away ?? "-"}</span>
      </div>

      {/* Column 5: Favorite Action */}
      <div className="w-16 flex-shrink-0 flex items-center justify-end">
        <button className="p-2 text-text-muted transition-colors duration-300 group-hover:text-brand-yellow">
          <Star size={20} />
        </button>
      </div>
    </Link>
  );
}

// Skeleton code is unchanged.
export const MatchListItemSkeleton = () => (
  <div
    className="flex items-center p-3 rounded-lg animate-pulse"
    style={{ backgroundColor: "var(--color-secondary)" }}
  >
    <div className="w-20 flex-shrink-0">
      <div className="h-5 w-10 mx-auto rounded bg-gray-600/50"></div>
    </div>
    <div className="flex-1 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 w-3/5">
          <div className="w-6 h-6 rounded-full bg-gray-600/50"></div>
          <div className="h-5 w-full rounded bg-gray-600/50"></div>
        </div>
        <div className="h-5 w-6 rounded bg-gray-600/50"></div>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 w-3/5">
          <div className="w-6 h-6 rounded-full bg-gray-600/50"></div>
          <div className="h-5 w-full rounded bg-gray-600/50"></div>
        </div>
        <div className="h-5 w-6 rounded bg-gray-600/50"></div>
      </div>
    </div>
    <div className="w-16 flex-shrink-0 flex items-center justify-end">
      <div className="h-6 w-6 rounded-full bg-gray-600/50"></div>
    </div>
  </div>
);
